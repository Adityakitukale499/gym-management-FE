import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertGymSchema, 
  forgotPasswordSchema, 
  verifyOtpSchema, 
  resetPasswordSchema,
  Gym
} from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Gym {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "gym-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const gym = await storage.getGymByUsername(username);
        if (!gym || !(await comparePasswords(password, gym.password))) {
          return done(null, false);
        } 
        return done(null, gym);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((gym, done) => done(null, gym.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const gym = await storage.getGym(id);
      done(null, gym);
    } catch (error) {
      done(error);
    }
  });

  // Register a new gym
  app.post("/api/register", async (req, res, next) => {
    try {
      const gymData = insertGymSchema.parse(req.body);
      
      const existingGym = await storage.getGymByUsername(gymData.username);
      if (existingGym) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const emailExists = await storage.getGymByEmail(gymData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(gymData.password);
      
      const gym = await storage.createGym({
        ...gymData,
        password: hashedPassword,
      });

      req.login(gym, (err) => {
        if (err) return next(err);
        // Remove password before sending response
        const { password, ...gymWithoutPassword } = gym;
        res.status(201).json(gymWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, gym: Gym) => {
        if (err) return next(err);
        if (!gym) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        req.login(gym, (err) => {
          if (err) return next(err);
          
          // Remove password before sending response
          const { password, ...gymWithoutPassword } = gym;
          return res.status(200).json(gymWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    // Remove password before sending response
    const { password, ...gymWithoutPassword } = req.user;
    res.json(gymWithoutPassword);
  });

  // Request password reset (send OTP)
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      const gym = await storage.getGymByEmail(email);
      if (!gym) {
        // For security reasons, don't reveal if email exists
        return res.status(200).json({ message: "If your email is registered, you will receive an OTP" });
      }

      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP expires in 15 minutes
      
      await storage.createOtp({
        email,
        code: otp,
        expiresAt,
      });
      
      // In a real application, send the OTP via email
      // For now, we'll just return it in the response for testing
      console.log(`OTP for ${email}: ${otp}`);
      
      res.status(200).json({ message: "If your email is registered, you will receive an OTP" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Verify OTP
  app.post("/api/verify-otp", async (req, res, next) => {
    try {
      const { email, code } = verifyOtpSchema.parse(req.body);
      
      const otp = await storage.getValidOtp(email, code);
      
      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { email, code, password } = resetPasswordSchema.parse(req.body);
      
      const otp = await storage.getValidOtp(email, code);
      
      if (!otp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      
      const gym = await storage.getGymByEmail(email);
      
      if (!gym) {
        return res.status(400).json({ message: "Email not found" });
      }
      
      const hashedPassword = await hashPassword(password);
      
      await storage.updateGymPassword(gym.id, hashedPassword);
      
      // Remove the used OTP
      await storage.deleteOtp(otp.id);
      
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });
}