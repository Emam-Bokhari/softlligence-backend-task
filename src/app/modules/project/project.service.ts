import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../builder/queryBuilder";
import { PROJECT_STATUS } from "../../../enums/project";
import { SUBSCRIPTION_STATUS } from "../../../enums/subscription";
import { USER_ROLES } from "../../../enums/user";
import { SubscriptionPlan } from "../subscriptionPlan/subscriptionPlan.model";
import { User } from "../user/user.model";
import { PROJECT_SEARCHABLE_FIELDS } from "./project.constant";
import { TProject } from "./project.interface";
import { Project } from "./project.model";

// ======================= Create Project =======================
const createProjectToDB = async (
  currentUser: JwtPayload,
  payload: Partial<TProject>,
): Promise<TProject> => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT ? currentUser.id : currentUser.tenantId;

  if (!tenantId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only tenants can create projects!",
    );
  }

  // 1. Fetch Tenant details
  const tenant = await User.findOne({
    _id: tenantId,
    role: USER_ROLES.TENANT,
    isDeleted: { $ne: true },
  });

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant account not found!");
  }

  // 2. Feature Gating: Subscription check
  if (
    !tenant.subscriptionPlanId ||
    tenant.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You must purchase an active subscription plan before creating projects!",
    );
  }

  const plan = await SubscriptionPlan.findOne({
    _id: tenant.subscriptionPlanId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!plan) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your subscription plan is invalid or inactive. Please contact support.",
    );
  }

  // Check allowed modules
  if (
    plan.features?.allowedModules &&
    !plan.features.allowedModules.includes("projects")
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your current subscription plan does not have access to the projects module!",
    );
  }

  // Check maxProjects limit
  if (plan.features?.maxProjects) {
    const existingProjectsCount = await Project.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    });

    if (existingProjectsCount >= plan.features.maxProjects) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Project limit reached! Your plan allows a maximum of ${plan.features.maxProjects} projects. Please upgrade your plan.`,
      );
    }
  }

  // 3. Validate assigned users belong to this tenant
  if (payload.assignedUsers && payload.assignedUsers.length > 0) {
    const validUsersCount = await User.countDocuments({
      _id: { $in: payload.assignedUsers },
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    });

    if (validUsersCount !== payload.assignedUsers.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "One or more assigned users do not belong to your organization!",
      );
    }
  }

  // 4. Create project with strict tenantId scoping
  const projectData = {
    ...payload,
    tenantId: new Types.ObjectId(tenantId),
    progress: payload.progress || 0,
    status: payload.status || PROJECT_STATUS.PLANNING,
  };

  const result = await Project.create(projectData);
  return result;
};

// ======================= Get All Projects =======================
const getAllProjectsFromDB = async (
  currentUser: JwtPayload,
  query: Record<string, unknown>,
) => {
  const queryObj = { ...query };

  // Strict Multi-Tenant Query Scoping:
  const filterConditions: Record<string, any> = { isDeleted: { $ne: true } };

  if (currentUser.role === USER_ROLES.TENANT) {
    // Tenant sees all projects belonging to their organization
    filterConditions.tenantId = new Types.ObjectId(currentUser.id);
  } else if (currentUser.role === USER_ROLES.USER) {
    // Standard User only sees projects assigned to them under their tenant
    filterConditions.tenantId = new Types.ObjectId(currentUser.tenantId);
    filterConditions.assignedUsers = new Types.ObjectId(currentUser.id);
  } else if (currentUser.role === USER_ROLES.SUPER_ADMIN && query.tenantId) {
    // Super admin can optionally filter by a specific tenantId
    filterConditions.tenantId = new Types.ObjectId(query.tenantId as string);
  }

  const queryBuilder = new QueryBuilder(
    Project.find(filterConditions)
      .populate("assignedUsers", "name email")
      .populate("tenantId", "name email"),
    queryObj,
  )
    .search(PROJECT_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [projects, meta] = await Promise.all([
    queryBuilder.modelQuery.lean(),
    queryBuilder.countTotal(),
  ]);

  return {
    data: projects,
    meta,
  };
};

// ======================= Get Single Project =======================
const getProjectByIdFromDB = async (
  currentUser: JwtPayload,
  id: string,
): Promise<TProject | null> => {
  const project = await Project.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("assignedUsers", "name email")
    .populate("tenantId", "name email");

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found!");
  }

  // Strict Tenant Isolation Check
  if (currentUser.role === USER_ROLES.TENANT) {
    if (project.tenantId?._id?.toString() !== currentUser.id && project.tenantId?.toString() !== currentUser.id) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Access denied to this project!");
    }
  } else if (currentUser.role === USER_ROLES.USER) {
    const isAssigned = project.assignedUsers?.some(
      (user: any) => user._id?.toString() === currentUser.id,
    );
    if (!isAssigned) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You are not assigned to this project!");
    }
  }

  return project;
};

// ======================= Update Project =======================
const updateProjectToDB = async (
  currentUser: JwtPayload,
  id: string,
  payload: Partial<TProject>,
): Promise<TProject | null> => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT ? currentUser.id : currentUser.tenantId;

  const isExistProject = await Project.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!isExistProject) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found!");
  }

  // Ensure only the owner tenant (or super admin) can update
  if (
    currentUser.role === USER_ROLES.TENANT &&
    isExistProject.tenantId.toString() !== tenantId
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not own this project!");
  }

  // Validate assigned users if updating assignments
  if (payload.assignedUsers && payload.assignedUsers.length > 0) {
    const validUsersCount = await User.countDocuments({
      _id: { $in: payload.assignedUsers },
      tenantId: isExistProject.tenantId,
      isDeleted: { $ne: true },
    });

    if (validUsersCount !== payload.assignedUsers.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "One or more assigned users do not belong to your organization!",
      );
    }
  }

  const result = await Project.findOneAndUpdate(
    { _id: id },
    { $set: payload },
    { new: true, runValidators: true },
  ).populate("assignedUsers", "name email");

  return result;
};

// =================== Update Project Progress ===================
const updateProjectProgressToDB = async (
  currentUser: JwtPayload,
  id: string,
  progress: number,
  status?: PROJECT_STATUS,
): Promise<TProject | null> => {
  const project = await Project.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found!");
  }

  // Tenant Isolation and Access Check
  if (currentUser.role === USER_ROLES.USER) {
    const isAssigned = project.assignedUsers?.some(
      (userId: any) => userId.toString() === currentUser.id,
    );
    if (!isAssigned) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You cannot update progress for a project you are not assigned to!",
      );
    }
  } else if (
    currentUser.role === USER_ROLES.TENANT &&
    project.tenantId.toString() !== currentUser.id
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied to this project!");
  }

  // Feature Gating: Check if tenant's plan allows progress updates
  const tenant = await User.findById(project.tenantId);
  if (tenant?.subscriptionPlanId) {
    const plan = await SubscriptionPlan.findById(tenant.subscriptionPlanId);
    if (plan?.features && plan.features.canUpdateProgress === false) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Your subscription plan does not allow progress updates. Please upgrade your plan!",
      );
    }
  }

  // Automatically mark completed if progress reaches 100
  let newStatus = status || project.status;
  if (progress === 100 && !status) {
    newStatus = PROJECT_STATUS.COMPLETED;
  } else if (progress > 0 && progress < 100 && project.status === PROJECT_STATUS.PLANNING && !status) {
    newStatus = PROJECT_STATUS.IN_PROGRESS;
  }

  const result = await Project.findOneAndUpdate(
    { _id: id },
    { progress, status: newStatus },
    { new: true, runValidators: true },
  ).populate("assignedUsers", "name email");

  return result;
};

// ======================= Delete Project =======================
const deleteProjectFromDB = async (
  currentUser: JwtPayload,
  id: string,
): Promise<TProject | null> => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT ? currentUser.id : currentUser.tenantId;

  const isExistProject = await Project.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!isExistProject) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found!");
  }

  if (
    currentUser.role === USER_ROLES.TENANT &&
    isExistProject.tenantId.toString() !== tenantId
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not own this project!");
  }

  const result = await Project.findOneAndUpdate(
    { _id: id },
    { isDeleted: true },
    { new: true },
  );

  return result;
};

export const ProjectService = {
  createProjectToDB,
  getAllProjectsFromDB,
  getProjectByIdFromDB,
  updateProjectToDB,
  updateProjectProgressToDB,
  deleteProjectFromDB,
};
