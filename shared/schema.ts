import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  date,
  real,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gym owners table
export const gyms = pgTable("gyms", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  gymName: text("gym_name"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Membership plans table
export const membershipPlans = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationMonths: integer("duration_months").notNull(),
  price: real("price").notNull(),
  description: text("description"),
  gymId: text("gym_id")
    .notNull()
    .references(() => gyms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  photo: text("photo"),
  joiningDate: date("joining_date").notNull(),
  nextBillDate: date("next_bill_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isPaid: boolean("is_paid").default(true).notNull(),
  membershipPlanId: integer("membership_plan_id").references(
    () => membershipPlans.id
  ),
  gymId: text("gym_id")
    .notNull()
    .references(() => gyms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OTP table for password reset
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertGymSchema = createInsertSchema(gyms).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipPlanSchema = createInsertSchema(
  membershipPlans
).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSchema = createInsertSchema(otps).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// OTP verification schema
export const verifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  code: z.string().length(6, "OTP must be 6 characters"),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  code: z.string().length(6, "OTP must be 6 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type InsertGym = z.infer<typeof insertGymSchema>;
export type Gym = typeof gyms.$inferSelect;

export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otps.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpData = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
