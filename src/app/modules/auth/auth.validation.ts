import { z } from "zod";
import { GENDER, USER_ROLES } from "../../../enums/user";

export const signUpBodyZodSchema = z
  .object({
    name: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(1, "Full name is required"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().optional(),
    role: z
      .nativeEnum(USER_ROLES)
      .optional()
      .default(USER_ROLES.USER),
    gender: z.nativeEnum(GENDER).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.confirmPassword !== undefined &&
      data.confirmPassword !== data.password
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Password and confirm password do not match",
      });
    }
  });

const signUpZodSchema = z.object({
  body: signUpBodyZodSchema,
});

const createVerifyEmailZodSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email format"),
    oneTimeCode: z.number({ required_error: "One time code is required" }),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: "New Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({
      required_error: "Confirm Password is required",
    }),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: "Current Password is required",
    }),
    newPassword: z
      .string({ required_error: "New Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({
      required_error: "Confirm Password is required",
    }),
  }),
});

export const AuthValidation = {
  signUpZodSchema,
  createVerifyEmailZodSchema,
  createForgetPasswordZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
};
