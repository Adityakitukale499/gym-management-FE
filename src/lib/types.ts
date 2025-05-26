export interface TrainerPermissions {
  canViewMembers: boolean;
  canEditMembers: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewTrainers: boolean;
  canEditTrainers: boolean;
  canViewDashboard: boolean;
  canViewReports: boolean;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  permissions: TrainerPermissions;
  gymId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "trainer";

export interface User {
  id: string;
  email: string;
  gymName: string | null;
  username: string;
  password: string;
  photo: string | null;
  createdAt: Date;
  role: "admin" | "trainer";
  trainerId?: string;
  gymId: string;
}
