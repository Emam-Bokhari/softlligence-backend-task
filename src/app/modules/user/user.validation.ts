import { z } from "zod";
import { GENDER, STATUS } from "../../../enums/user";
import { signUpBodyZodSchema } from "../auth/auth.validation";

const createUserZodSchema = z.object({
  body: signUpBodyZodSchema,
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

export const UserValidation = {
  createUserZodSchema,
  updateProfileZodSchema,
  updateUserStatusZodSchema,
};
