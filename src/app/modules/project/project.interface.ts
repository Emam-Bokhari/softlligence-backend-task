import { Model, Types } from "mongoose";
import { PROJECT_STATUS } from "../../../enums/project";

export type TProject = {
  title: string;
  description?: string;
  tenantId: Types.ObjectId;
  assignedUsers: Types.ObjectId[];
  progress: number;
  status: PROJECT_STATUS;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProjectModel = Model<TProject>;
