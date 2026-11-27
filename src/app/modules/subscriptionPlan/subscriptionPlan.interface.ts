import { Model } from "mongoose";
import { PLAN_DURATION } from "../../../enums/subscription";

export type TPlanFeatures = {
  maxUsers: number;
  maxProjects: number;
  canUpdateProgress: boolean;
};

export type TSubscriptionPlan = {
  name: string;
  description?: string;
  price: number;
  duration: PLAN_DURATION;
  features: TPlanFeatures;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SubscriptionPlanModel = Model<TSubscriptionPlan>;
