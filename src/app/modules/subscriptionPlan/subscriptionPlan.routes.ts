import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLES } from "../../../enums/user";
import { SubscriptionPlanController } from "./subscriptionPlan.controller";
import { SubscriptionPlanValidation } from "./subscriptionPlan.validation";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.SUPER_ADMIN),
    validateRequest(
      SubscriptionPlanValidation.createSubscriptionPlanZodSchema,
    ),
    SubscriptionPlanController.createSubscriptionPlan,
  )
  .get(SubscriptionPlanController.getAllSubscriptionPlans);

router
  .route("/:id")
  .get(SubscriptionPlanController.getSubscriptionPlanById)
  .patch(
    auth(USER_ROLES.SUPER_ADMIN),
    validateRequest(
      SubscriptionPlanValidation.updateSubscriptionPlanZodSchema,
    ),
    SubscriptionPlanController.updateSubscriptionPlan,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN),
    SubscriptionPlanController.deleteSubscriptionPlan,
  );

export const SubscriptionPlanRoutes = router;
