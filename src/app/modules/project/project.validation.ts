import { z } from "zod";
import { PROJECT_STATUS } from "../../../enums/project";

const createProjectZodSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required",
    }).trim().min(1, "Title cannot be empty"),
    description: z.string().trim().optional(),
    assignedUsers: z.array(z.string()).optional(),
    status: z.nativeEnum(PROJECT_STATUS).optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
});

const updateProjectZodSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    description: z.string().trim().optional(),
    assignedUsers: z.array(z.string()).optional(),
    status: z.nativeEnum(PROJECT_STATUS).optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
});

const updateProgressZodSchema = z.object({
  body: z.object({
    progress: z
      .number({
        required_error: "Progress percentage is required",
      })
      .min(0, "Progress cannot be less than 0%")
      .max(100, "Progress cannot exceed 100%"),
    status: z.nativeEnum(PROJECT_STATUS).optional(),
  }),
});

export const ProjectValidation = {
  createProjectZodSchema,
  updateProjectZodSchema,
  updateProgressZodSchema,
};
