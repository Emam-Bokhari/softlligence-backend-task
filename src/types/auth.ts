import { GENDER, USER_ROLES } from "../enums/user";

export type ISignUpData = {
  name: string;
  email: string;
  password: string;
  role?: USER_ROLES;
  gender?: GENDER;
  [key: string]: any;
};

export type ILoginData = {
  email?: string;
  password?: string;
};

export type IVerifyEmail = {
  email?: string;
  oneTimeCode?: number;
};

export type IAuthResetPassword = {
  newPassword?: string;
  confirmPassword?: string;
};

export type IChangePassword = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};
