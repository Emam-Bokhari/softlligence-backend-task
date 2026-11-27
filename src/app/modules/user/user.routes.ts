import express from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { isAdmin, isAuthenticated } from "../../../helpers/authHelper";

const router = express.Router();


router
  .route("/profile")
  .get(isAuthenticated, UserController.getMyProfile)
  .patch(
    isAuthenticated,
    validateRequest(UserValidation.updateProfileZodSchema),
    UserController.updateProfile,
  )
  .delete(isAuthenticated, UserController.deleteProfile);


router
  .route("/")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT, USER_ROLES.ADMIN),
    UserController.getUsers,
  )
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser,
  );

router.post(
  "/create-member",
  auth(USER_ROLES.TENANT),
  validateRequest(UserValidation.createTeamMemberZodSchema),
  UserController.createTeamMember,
);

router.patch(
  "/status/:id",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatusById,
);

router.patch(
  "/:id/subscription",
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.updateTenantSubscriptionByAdmin,
);

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT),
    UserController.getUserById,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT),
    validateRequest(UserValidation.updateProfileZodSchema),
    UserController.updateTeamMember,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT),
    UserController.deleteUserById,
  );

export const UserRoutes = router;
