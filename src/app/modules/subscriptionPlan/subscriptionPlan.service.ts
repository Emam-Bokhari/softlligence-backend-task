import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../builder/queryBuilder";
import { SUBSCRIPTION_PLAN_SEARCHABLE_FIELDS } from "./subscriptionPlan.constant";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlan } from "./subscriptionPlan.model";

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

export const SubscriptionPlanService = {
  createSubscriptionPlanToDB,
  getAllSubscriptionPlansFromDB,
  getSubscriptionPlanByIdFromDB,
  updateSubscriptionPlanToDB,
  deleteSubscriptionPlanFromDB,
};
