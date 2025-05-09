import { 
  gyms, Gym, InsertGym,
  members, Member, InsertMember,
  membershipPlans, MembershipPlan, InsertMembershipPlan,
  otps, Otp, InsertOtp 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gte, lte, like, or, sql, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // Gym methods
  getGym(id: number): Promise<Gym | undefined>;
  getGymByUsername(username: string): Promise<Gym | undefined>;
  getGymByEmail(email: string): Promise<Gym | undefined>;
  createGym(gym: InsertGym): Promise<Gym>;
  updateGymPassword(id: number, password: string): Promise<Gym>;

  // Membership plan methods
  getMembershipPlans(gymId: number): Promise<MembershipPlan[]>;
  getMembershipPlan(id: number): Promise<MembershipPlan | undefined>;
  createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan>;
  updateMembershipPlan(id: number, plan: InsertMembershipPlan): Promise<MembershipPlan>;
  deleteMembershipPlan(id: number): Promise<void>;

  // Member methods
  getMembers(gymId: number, filter: any, limit: number, offset: number): Promise<{ members: Member[], total: number }>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: InsertMember): Promise<Member>;
  updateMemberStatus(id: number, isActive: boolean): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  countMembers(gymId: number): Promise<number>;
  countMembersJoinedAfter(gymId: number, date: Date): Promise<number>;
  countMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<number>;
  countExpiredMembers(gymId: number, date: Date): Promise<number>;
  countInactiveMembers(gymId: number): Promise<number>;
  getMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<Member[]>;
  getExpiredMembers(gymId: number, date: Date): Promise<Member[]>;

  // OTP methods
  createOtp(otp: InsertOtp): Promise<Otp>;
  getValidOtp(email: string, code: string): Promise<Otp | undefined>;
  deleteOtp(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.sessionStore = new PostgresSessionStore({ 
        pool: db.client as any,
        createTableIfMissing: true 
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // Gym methods
  async getGym(id: number): Promise<Gym | undefined> {
    const result = await db.select().from(gyms).where(eq(gyms.id, id));
    return result[0];
  }

  async getGymByUsername(username: string): Promise<Gym | undefined> {
    const result = await db.select().from(gyms).where(eq(gyms.username, username));
    return result[0];
  }

  async getGymByEmail(email: string): Promise<Gym | undefined> {
    const result = await db.select().from(gyms).where(eq(gyms.email, email));
    return result[0];
  }

  async createGym(gym: InsertGym): Promise<Gym> {
    const result = await db.insert(gyms).values(gym).returning();
    return result[0];
  }

  async updateGymPassword(id: number, password: string): Promise<Gym> {
    const result = await db
      .update(gyms)
      .set({ password })
      .where(eq(gyms.id, id))
      .returning();
    return result[0];
  }

  // Membership plan methods
  async getMembershipPlans(gymId: number): Promise<MembershipPlan[]> {
    return db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.gymId, gymId))
      .orderBy(membershipPlans.durationMonths);
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    const result = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, id));
    return result[0];
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const result = await db
      .insert(membershipPlans)
      .values(plan)
      .returning();
    return result[0];
  }

  async updateMembershipPlan(id: number, plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const result = await db
      .update(membershipPlans)
      .set(plan)
      .where(eq(membershipPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteMembershipPlan(id: number): Promise<void> {
    await db
      .delete(membershipPlans)
      .where(eq(membershipPlans.id, id));
  }

  // Member methods
  async getMembers(
    gymId: number, 
    filter: any = {}, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ members: Member[], total: number }> {
    // Build the where clause based on filters
    let whereClause = eq(members.gymId, gymId);
    
    if (filter.name) {
      whereClause = and(
        whereClause,
        like(members.name, `%${filter.name}%`)
      );
    }
    
    if (filter.phone) {
      whereClause = and(
        whereClause,
        like(members.phone, `%${filter.phone}%`)
      );
    }
    
    if (filter.status === 'active') {
      whereClause = and(whereClause, eq(members.isActive, true));
    } else if (filter.status === 'inactive') {
      whereClause = and(whereClause, eq(members.isActive, false));
    } else if (filter.status === 'expired') {
      whereClause = and(
        whereClause,
        lt(members.nextBillDate, new Date().toISOString().split('T')[0])
      );
    }
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(whereClause);
    
    const total = Number(countResult[0].count);
    
    // Get paginated members
    const membersList = await db
      .select()
      .from(members)
      .where(whereClause)
      .orderBy(desc(members.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { members: membersList, total };
  }

  async getMember(id: number): Promise<Member | undefined> {
    const result = await db
      .select()
      .from(members)
      .where(eq(members.id, id));
    return result[0];
  }

  async createMember(member: InsertMember): Promise<Member> {
    const result = await db
      .insert(members)
      .values(member)
      .returning();
    return result[0];
  }

  async updateMember(id: number, member: InsertMember): Promise<Member> {
    const result = await db
      .update(members)
      .set(member)
      .where(eq(members.id, id))
      .returning();
    return result[0];
  }

  async updateMemberStatus(id: number, isActive: boolean): Promise<Member> {
    const result = await db
      .update(members)
      .set({ isActive })
      .where(eq(members.id, id))
      .returning();
    return result[0];
  }

  async deleteMember(id: number): Promise<void> {
    await db
      .delete(members)
      .where(eq(members.id, id));
  }

  async countMembers(gymId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.gymId, gymId));
    return Number(result[0].count);
  }

  async countMembersJoinedAfter(gymId: number, date: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          gte(members.joiningDate, date.toISOString().split('T')[0])
        )
      );
    return Number(result[0].count);
  }

  async countMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          gte(members.nextBillDate, startDate.toISOString().split('T')[0]),
          lte(members.nextBillDate, endDate.toISOString().split('T')[0]),
          eq(members.isActive, true)
        )
      );
    return Number(result[0].count);
  }

  async countExpiredMembers(gymId: number, date: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          lt(members.nextBillDate, date.toISOString().split('T')[0])
        )
      );
    return Number(result[0].count);
  }

  async countInactiveMembers(gymId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          eq(members.isActive, false)
        )
      );
    return Number(result[0].count);
  }

  async getMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<Member[]> {
    return db
      .select()
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          gte(members.nextBillDate, startDate.toISOString().split('T')[0]),
          lte(members.nextBillDate, endDate.toISOString().split('T')[0]),
          eq(members.isActive, true)
        )
      )
      .orderBy(members.nextBillDate);
  }

  async getExpiredMembers(gymId: number, date: Date): Promise<Member[]> {
    return db
      .select()
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          lt(members.nextBillDate, date.toISOString().split('T')[0])
        )
      )
      .orderBy(members.nextBillDate);
  }

  // OTP methods
  async createOtp(otp: InsertOtp): Promise<Otp> {
    const result = await db
      .insert(otps)
      .values(otp)
      .returning();
    return result[0];
  }

  async getValidOtp(email: string, code: string): Promise<Otp | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.code, code),
          gte(otps.expiresAt, now)
        )
      );
    return result[0];
  }

  async deleteOtp(id: number): Promise<void> {
    await db
      .delete(otps)
      .where(eq(otps.id, id));
  }
}

export class MemStorage implements IStorage {
  sessionStore: session.SessionStore;
  private gyms: Map<number, Gym>;
  private membershipPlans: Map<number, MembershipPlan>;
  private members: Map<number, Member>;
  private otps: Map<number, Otp>;
  private gymIdCounter: number;
  private planIdCounter: number;
  private memberIdCounter: number;
  private otpIdCounter: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.gyms = new Map();
    this.membershipPlans = new Map();
    this.members = new Map();
    this.otps = new Map();
    this.gymIdCounter = 1;
    this.planIdCounter = 1;
    this.memberIdCounter = 1;
    this.otpIdCounter = 1;
  }

  // Gym methods
  async getGym(id: number): Promise<Gym | undefined> {
    return this.gyms.get(id);
  }

  async getGymByUsername(username: string): Promise<Gym | undefined> {
    return Array.from(this.gyms.values()).find(gym => gym.username === username);
  }

  async getGymByEmail(email: string): Promise<Gym | undefined> {
    return Array.from(this.gyms.values()).find(gym => gym.email === email);
  }

  async createGym(gym: InsertGym): Promise<Gym> {
    const id = this.gymIdCounter++;
    const newGym: Gym = {
      ...gym,
      id,
      createdAt: new Date(),
    };
    this.gyms.set(id, newGym);
    return newGym;
  }

  async updateGymPassword(id: number, password: string): Promise<Gym> {
    const gym = this.gyms.get(id);
    if (!gym) {
      throw new Error("Gym not found");
    }
    
    const updatedGym = { ...gym, password };
    this.gyms.set(id, updatedGym);
    return updatedGym;
  }

  // Membership plan methods
  async getMembershipPlans(gymId: number): Promise<MembershipPlan[]> {
    return Array.from(this.membershipPlans.values())
      .filter(plan => plan.gymId === gymId)
      .sort((a, b) => a.durationMonths - b.durationMonths);
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    return this.membershipPlans.get(id);
  }

  async createMembershipPlan(plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const id = this.planIdCounter++;
    const newPlan: MembershipPlan = {
      ...plan,
      id,
      createdAt: new Date(),
    };
    this.membershipPlans.set(id, newPlan);
    return newPlan;
  }

  async updateMembershipPlan(id: number, plan: InsertMembershipPlan): Promise<MembershipPlan> {
    const existingPlan = this.membershipPlans.get(id);
    if (!existingPlan) {
      throw new Error("Membership plan not found");
    }
    
    const updatedPlan: MembershipPlan = {
      ...existingPlan,
      ...plan,
    };
    this.membershipPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteMembershipPlan(id: number): Promise<void> {
    this.membershipPlans.delete(id);
  }

  // Member methods
  async getMembers(
    gymId: number, 
    filter: any = {}, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ members: Member[], total: number }> {
    let filteredMembers = Array.from(this.members.values())
      .filter(member => member.gymId === gymId);
    
    if (filter.name) {
      filteredMembers = filteredMembers.filter(member => 
        member.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    }
    
    if (filter.phone) {
      filteredMembers = filteredMembers.filter(member => 
        member.phone.includes(filter.phone)
      );
    }
    
    if (filter.status === 'active') {
      filteredMembers = filteredMembers.filter(member => member.isActive);
    } else if (filter.status === 'inactive') {
      filteredMembers = filteredMembers.filter(member => !member.isActive);
    } else if (filter.status === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      filteredMembers = filteredMembers.filter(member => 
        member.nextBillDate < today
      );
    }
    
    const total = filteredMembers.length;
    
    // Sort by created date descending
    filteredMembers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const paginatedMembers = filteredMembers.slice(offset, offset + limit);
    
    return { members: paginatedMembers, total };
  }

  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async createMember(member: InsertMember): Promise<Member> {
    const id = this.memberIdCounter++;
    const newMember: Member = {
      ...member,
      id,
      createdAt: new Date(),
    };
    this.members.set(id, newMember);
    return newMember;
  }

  async updateMember(id: number, member: InsertMember): Promise<Member> {
    const existingMember = this.members.get(id);
    if (!existingMember) {
      throw new Error("Member not found");
    }
    
    const updatedMember: Member = {
      ...existingMember,
      ...member,
    };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async updateMemberStatus(id: number, isActive: boolean): Promise<Member> {
    const member = this.members.get(id);
    if (!member) {
      throw new Error("Member not found");
    }
    
    const updatedMember = { ...member, isActive };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<void> {
    this.members.delete(id);
  }

  async countMembers(gymId: number): Promise<number> {
    return Array.from(this.members.values())
      .filter(member => member.gymId === gymId)
      .length;
  }

  async countMembersJoinedAfter(gymId: number, date: Date): Promise<number> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        member.joiningDate >= dateStr
      )
      .length;
  }

  async countMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<number> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        member.isActive &&
        member.nextBillDate >= startDateStr && 
        member.nextBillDate <= endDateStr
      )
      .length;
  }

  async countExpiredMembers(gymId: number, date: Date): Promise<number> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        member.nextBillDate < dateStr
      )
      .length;
  }

  async countInactiveMembers(gymId: number): Promise<number> {
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        !member.isActive
      )
      .length;
  }

  async getMembersExpiringBetween(gymId: number, startDate: Date, endDate: Date): Promise<Member[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        member.isActive &&
        member.nextBillDate >= startDateStr && 
        member.nextBillDate <= endDateStr
      )
      .sort((a, b) => 
        new Date(a.nextBillDate).getTime() - new Date(b.nextBillDate).getTime()
      );
  }

  async getExpiredMembers(gymId: number, date: Date): Promise<Member[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.members.values())
      .filter(member => 
        member.gymId === gymId && 
        member.nextBillDate < dateStr
      )
      .sort((a, b) => 
        new Date(a.nextBillDate).getTime() - new Date(b.nextBillDate).getTime()
      );
  }

  // OTP methods
  async createOtp(otp: InsertOtp): Promise<Otp> {
    const id = this.otpIdCounter++;
    const newOtp: Otp = {
      ...otp,
      id,
      createdAt: new Date(),
    };
    this.otps.set(id, newOtp);
    return newOtp;
  }

  async getValidOtp(email: string, code: string): Promise<Otp | undefined> {
    const now = new Date();
    
    return Array.from(this.otps.values())
      .find(otp => 
        otp.email === email && 
        otp.code === code && 
        new Date(otp.expiresAt) > now
      );
  }

  async deleteOtp(id: number): Promise<void> {
    this.otps.delete(id);
  }
}

export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
