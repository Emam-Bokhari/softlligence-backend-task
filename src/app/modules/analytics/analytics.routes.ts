import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { AnalyticsController } from "./analytics.controller";

const router = express.Router();

// GET /api/v1/analytics/admin-stats - Super Admin
router.get(
  "/admin-stats",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  AnalyticsController.getAdminStats,
);

// GET /api/v1/analytics/tenant-stats - Tenant
router.get(
  "/tenant-stats",
  auth(USER_ROLES.TENANT),
  AnalyticsController.getTenantStats,
);

// GET /api/v1/analytics/user-stats - Team Member (User)
router.get(
  "/user-stats",
  auth(USER_ROLES.USER, USER_ROLES.TENANT),
  AnalyticsController.getUserStats,
);

export const AnalyticsRoutes = router;
