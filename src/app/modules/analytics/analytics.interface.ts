import { Types } from "mongoose";

export type TAdminStats = {
  totalTenants: number;
  totalUsers: number;
  totalProjects: number;
  activePlansCount: number;
  recentSignups: Record<string, any>[];
  projectsByStatus: {
    planning: number;
    in_progress: number;
    completed: number;
    on_hold: number;
    inProgress?: number;
    onHold?: number;
  };
};

export type TTenantStats = {
  projectCounts: {
    planning: number;
    inProgress: number;
    completed: number;
    onHold: number;
    in_progress?: number;
    on_hold?: number;
  };
  teamCount: {
    total: number;
    active: number;
    inactive: number;
  };
  recentActivities: {
    _id?: string | Types.ObjectId;
    type: string;
    action: string;
    title: string;
    message: string;
    status?: string;
    progress?: number;
    timestamp?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }[];
};

export type TUserStats = {
  assignedProjectsTotal: number;
  completedProjects: number;
  inProgressProjects: number;
  organizationInfo: {
    name: string;
    planName: string;
  };
};
