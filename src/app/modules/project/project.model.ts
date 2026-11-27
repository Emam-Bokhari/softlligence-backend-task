import { model, Schema } from "mongoose";
import { PROJECT_STATUS } from "../../../enums/project";
import { ProjectModel, TProject } from "./project.interface";

const projectSchema = new Schema<TProject, ProjectModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PLANNING,
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

projectSchema.index({ tenantId: 1, isDeleted: 1 });

export const Project = model<TProject, ProjectModel>("Project", projectSchema);
