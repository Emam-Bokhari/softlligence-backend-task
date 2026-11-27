import { USER_ROLES } from "../../../enums/user";

export type TJwtPayload = {
  id: string;
  email: string;
  role: USER_ROLES;
  tenantId?: string;
};

export type ITenantRegisterData = {
  name: string;
  email: string;
  password: string;
  subscriptionPlanId: string;
};

