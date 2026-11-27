import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { PROJECT_STATUS } from "../../../enums/project";
import { STATUS, USER_ROLES } from "../../../enums/user";
import { Project } from "../project/project.model";
import { SubscriptionPlan } from "../subscriptionPlan/subscriptionPlan.model";
import { User } from "../user/user.model";
import { TAdminStats, TTenantStats, TUserStats } from "./analytics.interface";

const getAdminStatsFromDB = async (): Promise<TAdminStats> => {
  const [
    totalTenants,
    totalUsers,
    totalProjects,
    activePlansCount,
    recentSignups,
    projectStatusCounts,
  ] = await Promise.all([
    // Total tenants
    User.countDocuments({
      role: USER_ROLES.TENANT,
      isDeleted: { $ne: true },
    }),
    // Total regular users / team members
    User.countDocuments({
      role: USER_ROLES.USER,
      isDeleted: { $ne: true },
    }),
    // Total projects across the system
    Project.countDocuments({
      isDeleted: { $ne: true },
    }),
    // Active subscription plans
    SubscriptionPlan.countDocuments({
      isActive: true,
      isDeleted: { $ne: true },
    }),
    // Last 5 registered users
    User.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password -authentication")
      .populate("tenantId", "name email")
      .populate("subscriptionPlanId", "name price duration")
      .lean(),
    // Group projects by status
    Project.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap: Record<string, number> = {
    [PROJECT_STATUS.PLANNING]: 0,
    [PROJECT_STATUS.IN_PROGRESS]: 0,
    [PROJECT_STATUS.COMPLETED]: 0,
    [PROJECT_STATUS.ON_HOLD]: 0,
  };

  projectStatusCounts.forEach((item: { _id: string; count: number }) => {
    if (item._id && Object.prototype.hasOwnProperty.call(statusMap, item._id)) {
      statusMap[item._id] = item.count;
    }
  });

  return {
    totalTenants,
    totalUsers,
    totalProjects,
    activePlansCount,
    recentSignups,
    projectsByStatus: {
      planning: statusMap[PROJECT_STATUS.PLANNING],
      in_progress: statusMap[PROJECT_STATUS.IN_PROGRESS],
      completed: statusMap[PROJECT_STATUS.COMPLETED],
      on_hold: statusMap[PROJECT_STATUS.ON_HOLD],
      inProgress: statusMap[PROJECT_STATUS.IN_PROGRESS],
      onHold: statusMap[PROJECT_STATUS.ON_HOLD],
    },
  };
};

const getTenantStatsFromDB = async (
  currentUser: JwtPayload,
): Promise<TTenantStats> => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT
      ? currentUser.id
      : currentUser.tenantId;

  const tenantObjectId = new Types.ObjectId(tenantId);

  const [
    projectStatusCounts,
    memberStatusCounts,
    recentProjects,
    recentMembers,
  ] = await Promise.all([
    // Group projects by status for this tenant
    Project.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // Group members by active/inactive for this tenant
    User.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // Recent projects updated or created
    Project.find({
      tenantId: tenantObjectId,
      isDeleted: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("assignedUsers", "name email")
      .lean(),
    // Recent team members joined
    User.find({
      tenantId: tenantObjectId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role status createdAt")
      .lean(),
  ]);

  // Project counts map
  const projectMap: Record<string, number> = {
    [PROJECT_STATUS.PLANNING]: 0,
    [PROJECT_STATUS.IN_PROGRESS]: 0,
    [PROJECT_STATUS.COMPLETED]: 0,
    [PROJECT_STATUS.ON_HOLD]: 0,
  };

  projectStatusCounts.forEach((item: { _id: string; count: number }) => {
    if (
      item._id &&
      Object.prototype.hasOwnProperty.call(projectMap, item._id)
    ) {
      projectMap[item._id] = item.count;
    }
  });

  // Team counts
  let active = 0;
  let inactive = 0;
  memberStatusCounts.forEach((item: { _id: string; count: number }) => {
    if (item._id === STATUS.ACTIVE) active = item.count;
    if (item._id === STATUS.INACTIVE) inactive = item.count;
  });
  const total = active + inactive;

  // Synthesize recent activities
  const activities: TTenantStats["recentActivities"] = [];

  recentProjects.forEach((p: any) => {
    const isNew =
      p.createdAt &&
      p.updatedAt &&
      Math.abs(
        new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime(),
      ) < 2000;

    activities.push({
      _id: p._id,
      type: "project",
      action: isNew ? "PROJECT_CREATED" : "PROJECT_UPDATED",
      title: p.title,
      message: isNew
        ? `Project "${p.title}" was created.`
        : `Project "${p.title}" updated: Status is ${p.status} (${p.progress}% progress).`,
      status: p.status,
      progress: p.progress,
      timestamp: p.updatedAt || p.createdAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  });

  recentMembers.forEach((m: any) => {
    activities.push({
      _id: m._id,
      type: "team_member",
      action: "MEMBER_JOINED",
      title: m.name,
      message: `Team member "${m.name}" (${m.email}) joined the organization.`,
      status: m.status,
      timestamp: m.createdAt,
      createdAt: m.createdAt,
    });
  });

  // Sort activities chronologically (newest first) and take the top 5
  activities.sort(
    (a, b) =>
      new Date(b.timestamp || 0).getTime() -
      new Date(a.timestamp || 0).getTime(),
  );

  return {
    projectCounts: {
      planning: projectMap[PROJECT_STATUS.PLANNING],
      inProgress: projectMap[PROJECT_STATUS.IN_PROGRESS],
      completed: projectMap[PROJECT_STATUS.COMPLETED],
      onHold: projectMap[PROJECT_STATUS.ON_HOLD],
      in_progress: projectMap[PROJECT_STATUS.IN_PROGRESS],
      on_hold: projectMap[PROJECT_STATUS.ON_HOLD],
    },
    teamCount: {
      total,
      active,
      inactive,
    },
    recentActivities: activities.slice(0, 5),
  };
};

const getUserStatsFromDB = async (
  currentUser: JwtPayload,
): Promise<TUserStats> => {
  const userId = new Types.ObjectId(currentUser.id);

  // Determine query filter for user projects
  const filter: Record<string, any> = {
    assignedUsers: userId,
    isDeleted: { $ne: true },
  };

  // If a tenant checks user stats, they see their organization's projects
  if (currentUser.role === USER_ROLES.TENANT) {
    delete filter.assignedUsers;
    filter.tenantId = userId;
  }

  const [projectStats, user] = await Promise.all([
    Project.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.findById(currentUser.id).populate("subscriptionPlanId").lean(),
  ]);

  let assignedProjectsTotal = 0;
  let completedProjects = 0;
  let inProgressProjects = 0;

  projectStats.forEach((item: { _id: string; count: number }) => {
    assignedProjectsTotal += item.count;
    if (item._id === PROJECT_STATUS.COMPLETED) {
      completedProjects = item.count;
    }
    if (item._id === PROJECT_STATUS.IN_PROGRESS) {
      inProgressProjects = item.count;
    }
  });

  // Resolve organization and subscription plan info
  let orgName = "Organization";
  let planName = "No Active Plan";

  if (currentUser.role === USER_ROLES.USER && user?.tenantId) {
    const tenant: any = await User.findById(user.tenantId)
      .populate("subscriptionPlanId")
      .lean();
    if (tenant) {
      orgName = tenant.name || "Organization";
      if (tenant.subscriptionPlanId && tenant.subscriptionPlanId.name) {
        planName = tenant.subscriptionPlanId.name;
      }
    }
  } else if (currentUser.role === USER_ROLES.TENANT && user) {
    orgName = user.name || "Organization";
    if (user.subscriptionPlanId && (user.subscriptionPlanId as any).name) {
      planName = (user.subscriptionPlanId as any).name;
    }
  }

  return {
    assignedProjectsTotal,
    completedProjects,
    inProgressProjects,
    organizationInfo: {
      name: orgName,
      planName,
    },
  };
};

export const AnalyticsService = {
  getAdminStatsFromDB,
  getTenantStatsFromDB,
  getUserStatsFromDB,
};
