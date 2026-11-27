import { JwtPayload } from "jsonwebtoken";
import { USER_ROLES } from "../enums/user";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & {
        id: string;
        email: string;
        role: USER_ROLES;
        tenantId?: string;
      };
      rawBody?: any;
    }
  }
}
