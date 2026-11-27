import { model, Schema } from "mongoose";
import { PLAN_DURATION } from "../../../enums/subscription";
import {
  SubscriptionPlanModel,
  TPlanFeatures,
  TSubscriptionPlan,
} from "./subscriptionPlan.interface";

const planFeaturesSchema = new Schema<TPlanFeatures>(
  {
    maxUsers: {
      type: Number,
      required: true,
      default: 5,
    },
    maxProjects: {
      type: Number,
      required: true,
      default: 5,
    },
    canUpdateProgress: {
      type: Boolean,
      default: true,
    },
    allowedModules: {
      type: [String],
      default: ["projects"],
    },
  },
  { _id: false },
);

const subscriptionPlanSchema = new Schema<
  TSubscriptionPlan,
  SubscriptionPlanModel
>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    duration: {
      type: String,
      enum: Object.values(PLAN_DURATION),
      default: PLAN_DURATION.MONTHLY,
    },
    features: {
      type: planFeaturesSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subscriptionPlanSchema.index({ isActive: 1, isDeleted: 1 });

export const SubscriptionPlan = model<
  TSubscriptionPlan,
  SubscriptionPlanModel
>("SubscriptionPlan", subscriptionPlanSchema);
