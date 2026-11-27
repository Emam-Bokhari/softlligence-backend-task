import { z } from "zod";
import { GENDER, STATUS } from "../../../enums/user";
import { SUBSCRIPTION_STATUS } from "../../../enums/subscription";
import { signUpBodyZodSchema } from "../auth/auth.validation";

const createUserZodSchema = z.object({
  body: signUpBodyZodSchema,
});

const createTeamMemberZodSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(1, "Full name cannot be empty"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    gender: z.nativeEnum(GENDER).optional(),
  }),
});

const updateProfileZodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name cannot be empty").optional(),
    gender: z.nativeEnum(GENDER).optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
  }),
});

const updateUserStatusZodSchema = z.object({
  body: z.object({
    status: z.nativeEnum(STATUS, {
      required_error: "Status is required (active or inactive)",
    }),
  }),
});

const updateTenantSubscriptionZodSchema = z.object({
  body: z.object({
    subscriptionPlanId: z.string().optional(),
    subscriptionStatus: z.nativeEnum(SUBSCRIPTION_STATUS).optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  createTeamMemberZodSchema,
  updateProfileZodSchema,
  updateUserStatusZodSchema,
  updateTenantSubscriptionZodSchema,
};

