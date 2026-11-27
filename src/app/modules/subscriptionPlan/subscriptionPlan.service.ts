import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../builder/queryBuilder";
import { SUBSCRIPTION_PLAN_SEARCHABLE_FIELDS } from "./subscriptionPlan.constant";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlan } from "./subscriptionPlan.model";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../user/user.model";
import { Project } from "../project/project.model";
import { SUBSCRIPTION_STATUS } from "../../../enums/subscription";
import { USER_ROLES } from "../../../enums/user";
import { Types } from "mongoose";

const createSubscriptionPlanToDB = async (
  payload: TSubscriptionPlan,
): Promise<TSubscriptionPlan> => {
  const isExistPlan = await SubscriptionPlan.findOne({
    name: payload.name.trim(),
    isDeleted: { $ne: true },
  });

  if (isExistPlan) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "A subscription plan with this name already exists!",
    );
  }

  const result = await SubscriptionPlan.create(payload);
  return result;
};

const getAllSubscriptionPlansFromDB = async (
  query: Record<string, unknown>,
) => {
  const queryObj = { ...query };

  const queryBuilder = new QueryBuilder(
    SubscriptionPlan.find({ isDeleted: { $ne: true } }),
    queryObj,
  )
    .search(SUBSCRIPTION_PLAN_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [plans, meta] = await Promise.all([
    queryBuilder.modelQuery.lean(),
    queryBuilder.countTotal(),
  ]);

  return {
    data: plans,
    meta,
  };
};

const getSubscriptionPlanByIdFromDB = async (
  id: string,
): Promise<TSubscriptionPlan | null> => {
  const result = await SubscriptionPlan.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Subscription plan not found!");
  }

  return result;
};

const updateSubscriptionPlanToDB = async (
  id: string,
  payload: Partial<TSubscriptionPlan>,
): Promise<TSubscriptionPlan | null> => {
  const isExistPlan = await SubscriptionPlan.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!isExistPlan) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Subscription plan not found!");
  }

  // Handle nested features update if provided
  const updatePayload: Record<string, any> = { ...payload };
  if (payload.features) {
    Object.keys(payload.features).forEach((key) => {
      updatePayload[`features.${key}`] = (payload.features as any)[key];
    });
    delete updatePayload.features;
  }

  const result = await SubscriptionPlan.findOneAndUpdate(
    { _id: id },
    { $set: updatePayload },
    { new: true, runValidators: true },
  );

  return result;
};

const deleteSubscriptionPlanFromDB = async (
  id: string,
): Promise<TSubscriptionPlan | null> => {
  const isExistPlan = await SubscriptionPlan.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!isExistPlan) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Subscription plan not found!");
  }

  const result = await SubscriptionPlan.findOneAndUpdate(
    { _id: id },
    { isDeleted: true, isActive: false },
    { new: true },
  );

  return result;
};

// =================== Direct Purchase / Subscribe ===================
const purchaseSubscriptionPlanToDB = async (
  currentUser: JwtPayload,
  planId: string,
) => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT
      ? currentUser.id
      : currentUser.tenantId;

  if (!tenantId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only tenants can purchase a subscription plan!",
    );
  }

  // 1. Verify plan exists and is active
  const plan = await SubscriptionPlan.findOne({
    _id: planId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!plan) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Subscription plan not found or is currently inactive!",
    );
  }

  // 2. Direct purchase: Update tenant with the active plan
  const updatedTenant = await User.findOneAndUpdate(
    { _id: tenantId },
    {
      subscriptionPlanId: new Types.ObjectId(planId),
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
    },
    { new: true },
  ).select("-password -authentication");

  if (!updatedTenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant account not found!");
  }

  return {
    tenant: updatedTenant,
    plan,
  };
};

const toggleFeatureInPlanToDB = async (
  id: string,
  featureKey: string,
  value: any,
) => {
  const isExistPlan = await SubscriptionPlan.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!isExistPlan) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Subscription plan not found!");
  }

  const updateDoc: Record<string, any> = {};

  if (featureKey === "isActive") {
    updateDoc.isActive = Boolean(value);
  } else if (
    ["canUpdateProgress", "allowedModules", "maxUsers", "maxProjects"].includes(
      featureKey,
    )
  ) {
    updateDoc[`features.${featureKey}`] = value;
  } else {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid feature key '${featureKey}'. Allowed: canUpdateProgress, allowedModules, isActive, maxUsers, maxProjects`,
    );
  }

  const result = await SubscriptionPlan.findOneAndUpdate(
    { _id: id },
    { $set: updateDoc },
    { new: true, runValidators: true },
  );

  return result;
};

const getMySubscriptionPlanFromDB = async (currentUser: JwtPayload) => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT
      ? currentUser.id
      : currentUser.tenantId;

  if (!tenantId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "No tenant associated with this account!",
    );
  }

  const tenant = await User.findById(tenantId);
  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found!");
  }

  if (!tenant.subscriptionPlanId) {
    return {
      hasActiveSubscription: false,
      message: "No subscription plan purchased yet.",
      plan: null,
      status: null,
    };
  }

  const plan = await SubscriptionPlan.findById(tenant.subscriptionPlanId);

  // Compute live resource usage for tenant
  const [currentUsersCount, currentProjectsCount] = await Promise.all([
    User.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }),
    Project.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    }),
  ]);

  const maxUsers = plan?.features?.maxUsers || 0;
  const maxProjects = plan?.features?.maxProjects || 0;

  return {
    hasActiveSubscription:
      tenant.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE,
    status: tenant.subscriptionStatus,
    plan,
    usage: {
      users: {
        used: currentUsersCount,
        max: maxUsers,
        remaining: Math.max(0, maxUsers - currentUsersCount),
      },
      projects: {
        used: currentProjectsCount,
        max: maxProjects,
        remaining: Math.max(0, maxProjects - currentProjectsCount),
      },
    },
  };
};

export const SubscriptionPlanService = {
  createSubscriptionPlanToDB,
  getAllSubscriptionPlansFromDB,
  getSubscriptionPlanByIdFromDB,
  updateSubscriptionPlanToDB,
  deleteSubscriptionPlanFromDB,
  purchaseSubscriptionPlanToDB,
  toggleFeatureInPlanToDB,
  getMySubscriptionPlanFromDB,
};
