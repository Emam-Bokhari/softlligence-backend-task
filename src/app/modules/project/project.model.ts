import { model, Schema } from "mongoose";
import { PROJECT_STATUS } from "../../../enums/project";
import { ProjectModel, TProject, TProjectActivity } from "./project.interface";

const activitySchema = new Schema<TProjectActivity>(
  {
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    _id: true,
  },
);

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
    activities: {
      type: [activitySchema],
      default: [],
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
projectSchema.index({ assignedUsers: 1, isDeleted: 1 });
projectSchema.index({ status: 1, isDeleted: 1 });

export const Project = model<TProject, ProjectModel>("Project", projectSchema);
