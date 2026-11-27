import { Model, Types } from "mongoose";
import { PROJECT_STATUS } from "../../../enums/project";

export type TProjectActivity = {
  _id?: Types.ObjectId;
  performedBy: Types.ObjectId;
  action: string;
  message: string;
  details?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TProject = {
  title: string;
  description?: string;
  tenantId: Types.ObjectId;
  assignedUsers: Types.ObjectId[];
  progress: number;
  status: PROJECT_STATUS;
  activities?: TProjectActivity[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProjectModel = Model<TProject>;
