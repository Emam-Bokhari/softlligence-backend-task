import { Model, Types } from "mongoose";
import { GENDER, STATUS, USER_ROLES } from "../../../enums/user";
import { SUBSCRIPTION_STATUS } from "../../../enums/subscription";

export type TUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  gender?: GENDER;
  verified: boolean;
  status: STATUS;
  tenantId?: Types.ObjectId;
  subscriptionPlanId?: Types.ObjectId;
  subscriptionStatus?: SUBSCRIPTION_STATUS;
  authentication?: {
    isResetPassword?: boolean;
    oneTimeCode?: number | null;
    expireAt?: Date | null;
    authType?: string | null;
  };
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserModel = {
  isExistUserById(id: string): Promise<TUser | null>;
  isExistUserByEmail(email: string): Promise<TUser | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
} & Model<TUser>;
