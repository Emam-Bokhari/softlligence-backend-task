import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { SUBSCRIPTION_STATUS } from "../../enums/subscription";
import { USER_ROLES } from "../../enums/user";
import { SubscriptionPlan } from "../modules/subscriptionPlan/subscriptionPlan.model";
import { User } from "../modules/user/user.model";

export const checkModuleAccess =
  (moduleName: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access!");
      }

      // super admin has unrestricted access to all modules
      if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
        return next();
      }

      const tenantId =
        currentUser.role === USER_ROLES.TENANT
          ? currentUser.id
          : currentUser.tenantId;

      if (!tenantId) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "No tenant associated with this account!",
        );
      }

      const tenant = await User.findById(tenantId);
      if (
        !tenant ||
        !tenant.subscriptionPlanId ||
        tenant.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE
      ) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "An active subscription plan is required to access this feature. Please purchase a plan!",
        );
      }

      const plan = await SubscriptionPlan.findOne({
        _id: tenant.subscriptionPlanId,
        isActive: true,
        isDeleted: { $ne: true },
      });

      if (
        !plan ||
        (plan.features?.allowedModules &&
          !plan.features.allowedModules.includes(moduleName))
      ) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          `Access denied! The '${moduleName}' module is disabled in your subscription plan.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
