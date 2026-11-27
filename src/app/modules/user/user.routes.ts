import express from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import {
  isAdmin,
  isAuthenticated,
} from "../../../helpers/authHelper";

const router = express.Router();

/* ---------------------------- PROFILE ROUTES ---------------------------- */
router
  .route("/profile")
  .get(isAuthenticated, UserController.getMyProfile)
  .patch(
    isAuthenticated,
    validateRequest(UserValidation.updateProfileZodSchema),
    UserController.updateProfile,
  )
  .delete(isAuthenticated, UserController.deleteProfile);

/* ---------------------------- USER CREATE & LIST ------------------------ */
router
  .route("/")
  .get(isAdmin, UserController.getUsers)
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser,
  );

router.patch(
  "/status/:id",
  isAdmin,
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatusById,
);

/* ---------------------------- DYNAMIC USER ID ROUTES (KEEP LAST!) ------- */
router
  .route("/:id")
  .get(isAdmin, UserController.getUserById)
  .delete(isAdmin, UserController.deleteUserById);

export const UserRoutes = router;
