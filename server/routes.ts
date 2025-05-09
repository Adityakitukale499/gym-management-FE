import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertMembershipPlanSchema, 
  insertMemberSchema,
} from "@shared/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { subDays, addMonths, format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to handle Zod validation errors
  const handleZodError = (err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  };

  app.use(handleZodError);

  // Get all membership plans for the logged-in gym
  app.get("/api/membership-plans", isAuthenticated, async (req, res, next) => {
    try {
      const gymId = req.user?.id;
      const plans = await storage.getMembershipPlans(gymId);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  // Create a new membership plan
  app.post("/api/membership-plans", isAuthenticated, async (req, res, next) => {
    try {
      const planData = insertMembershipPlanSchema.parse(req.body);
      const gymId = req.user?.id;

      const newPlan = await storage.createMembershipPlan({
        ...planData,
        gymId,
      });

      res.status(201).json(newPlan);
    } catch (error) {
      next(error);
    }
  });

  // Update a membership plan
  app.put("/api/membership-plans/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const planData = insertMembershipPlanSchema.parse(req.body);
      const gymId = req.user?.id;

      // Check if plan exists and belongs to this gym
      const existingPlan = await storage.getMembershipPlan(id);
      if (!existingPlan || existingPlan.gymId !== gymId) {
        return res.status(404).json({ message: "Membership plan not found" });
      }

      const updatedPlan = await storage.updateMembershipPlan(id, {
        ...planData,
        gymId,
      });

      res.json(updatedPlan);
    } catch (error) {
      next(error);
    }
  });

  // Delete a membership plan
  app.delete("/api/membership-plans/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const gymId = req.user?.id;

      // Check if plan exists and belongs to this gym
      const existingPlan = await storage.getMembershipPlan(id);
      if (!existingPlan || existingPlan.gymId !== gymId) {
        return res.status(404).json({ message: "Membership plan not found" });
      }

      await storage.deleteMembershipPlan(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Get all members for the logged-in gym
  app.get("/api/members", isAuthenticated, async (req, res, next) => {
    try {
      const gymId = req.user?.id;
      const { page = '1', limit = '10', name, phone, status } = req.query;
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      const filter: any = { name, phone, status };
      
      const { members, total } = await storage.getMembers(gymId, filter, limitNum, offset);
      
      res.json({
        members,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res, next) => {
    try {
      const gymId = req.user?.id;
      const today = new Date();
      
      // Get total members count
      const totalMembers = await storage.countMembers(gymId);
      
      // Get monthly joined (members who joined in the current month)
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyJoined = await storage.countMembersJoinedAfter(gymId, firstDayOfMonth);
      
      // Get members expiring in the next 3 days
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      const expiringThreeDays = await storage.countMembersExpiringBetween(gymId, today, threeDaysFromNow);
      
      // Get members expiring in the next week
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(today.getDate() + 7);
      const expiringWeek = await storage.countMembersExpiringBetween(gymId, today, oneWeekFromNow);
      
      // Get expired members (next bill date is in the past)
      const expiredMembers = await storage.countExpiredMembers(gymId, today);
      
      // Get inactive members
      const inactiveMembers = await storage.countInactiveMembers(gymId);
      
      res.json({
        totalMembers,
        monthlyJoined,
        expiringThreeDays,
        expiringWeek,
        expiredMembers,
        inactiveMembers
      });
    } catch (error) {
      next(error);
    }
  });

  // Get members expiring soon
  app.get("/api/members/expiring-soon", isAuthenticated, async (req, res, next) => {
    try {
      const gymId = req.user?.id;
      const today = new Date();
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(today.getDate() + 7);
      
      const expiringMembers = await storage.getMembersExpiringBetween(gymId, today, oneWeekFromNow);
      
      res.json(expiringMembers);
    } catch (error) {
      next(error);
    }
  });

  // Get expired members
  app.get("/api/members/expired", isAuthenticated, async (req, res, next) => {
    try {
      const gymId = req.user?.id;
      const today = new Date();
      
      const expiredMembers = await storage.getExpiredMembers(gymId, today);
      
      res.json(expiredMembers);
    } catch (error) {
      next(error);
    }
  });

  // Create a new member
  app.post("/api/members", isAuthenticated, async (req, res, next) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const gymId = req.user?.id;
      
      // Calculate next bill date based on membership plan
      let nextBillDate = new Date(memberData.joiningDate);
      
      if (memberData.membershipPlanId) {
        const plan = await storage.getMembershipPlan(memberData.membershipPlanId);
        if (plan) {
          nextBillDate = addMonths(new Date(memberData.joiningDate), plan.durationMonths);
        }
      }
      
      const newMember = await storage.createMember({
        ...memberData,
        gymId,
        nextBillDate: format(nextBillDate, 'yyyy-MM-dd'),
      });
      
      res.status(201).json(newMember);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific member
  app.get("/api/members/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const gymId = req.user?.id;
      
      const member = await storage.getMember(id);
      
      if (!member || member.gymId !== gymId) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json(member);
    } catch (error) {
      next(error);
    }
  });

  // Update a member
  app.put("/api/members/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const memberData = insertMemberSchema.parse(req.body);
      const gymId = req.user?.id;
      
      // Check if member exists and belongs to this gym
      const existingMember = await storage.getMember(id);
      if (!existingMember || existingMember.gymId !== gymId) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // If membership plan changes, recalculate next bill date
      let nextBillDate = memberData.nextBillDate;
      
      if (memberData.membershipPlanId && memberData.membershipPlanId !== existingMember.membershipPlanId) {
        const plan = await storage.getMembershipPlan(memberData.membershipPlanId);
        if (plan) {
          const joiningDate = memberData.joiningDate || existingMember.joiningDate;
          nextBillDate = format(addMonths(new Date(joiningDate), plan.durationMonths), 'yyyy-MM-dd');
        }
      }
      
      const updatedMember = await storage.updateMember(id, {
        ...memberData,
        gymId,
        nextBillDate,
      });
      
      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  });

  // Update member status (active/inactive)
  app.patch("/api/members/:id/status", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const gymId = req.user?.id;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      // Check if member exists and belongs to this gym
      const existingMember = await storage.getMember(id);
      if (!existingMember || existingMember.gymId !== gymId) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const updatedMember = await storage.updateMemberStatus(id, isActive);
      
      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  });

  // Renew a member's membership
  app.post("/api/members/:id/renew", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { membershipPlanId, isPaid } = req.body;
      const gymId = req.user?.id;
      
      // Check if member exists and belongs to this gym
      const existingMember = await storage.getMember(id);
      if (!existingMember || existingMember.gymId !== gymId) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get the membership plan
      const plan = await storage.getMembershipPlan(membershipPlanId);
      if (!plan) {
        return res.status(404).json({ message: "Membership plan not found" });
      }
      
      // Calculate new next bill date (from today)
      const today = new Date();
      const nextBillDate = addMonths(today, plan.durationMonths);
      
      const updatedMember = await storage.updateMember(id, {
        ...existingMember,
        membershipPlanId,
        isPaid: isPaid ?? true,
        isActive: true,
        nextBillDate: format(nextBillDate, 'yyyy-MM-dd'),
      });
      
      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  });

  // Delete a member
  app.delete("/api/members/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const gymId = req.user?.id;
      
      // Check if member exists and belongs to this gym
      const existingMember = await storage.getMember(id);
      if (!existingMember || existingMember.gymId !== gymId) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      await storage.deleteMember(id);
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
