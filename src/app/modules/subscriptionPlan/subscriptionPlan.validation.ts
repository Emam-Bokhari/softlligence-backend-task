import { z } from "zod";
import { PLAN_DURATION } from "../../../enums/subscription";

const planFeaturesZodSchema = z.object({
  maxUsers: z
    .number({
      required_error: "Maximum users limit is required",
    })
    .min(1, "maxUsers must be at least 1"),
  maxProjects: z
    .number({
      required_error: "Maximum projects limit is required",
    })
    .min(1, "maxProjects must be at least 1"),
  canUpdateProgress: z.boolean().default(true),
  allowedModules: z.array(z.string()).default(["projects"]),
});

const createSubscriptionPlanZodSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Plan name is required",
      })
      .trim()
      .min(1, "Plan name cannot be empty"),
    description: z.string().trim().optional(),
    price: z
      .number({
        required_error: "Price is required",
      })
      .min(0, "Price cannot be negative"),
    duration: z.nativeEnum(PLAN_DURATION, {
      required_error: "Duration is required (monthly or yearly)",
    }),
    features: planFeaturesZodSchema,
    isActive: z.boolean().optional(),
  }),
});

const updateSubscriptionPlanZodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Plan name cannot be empty").optional(),
    description: z.string().trim().optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
    duration: z.nativeEnum(PLAN_DURATION).optional(),
    features: planFeaturesZodSchema.partial().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const SubscriptionPlanValidation = {
  createSubscriptionPlanZodSchema,
  updateSubscriptionPlanZodSchema,
};
