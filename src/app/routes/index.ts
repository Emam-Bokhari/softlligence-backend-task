import express from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { SubscriptionPlanRoutes } from "../modules/subscriptionPlan/subscriptionPlan.routes";

const router = express.Router();

const apiRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/subscription-plans",
    route: SubscriptionPlanRoutes,
  },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
