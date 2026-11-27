import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { checkModuleAccess } from "../../middlewares/checkModuleAccess";
import { USER_ROLES } from "../../../enums/user";
import { ProjectController } from "./project.controller";
import { ProjectValidation } from "./project.validation";

const router = express.Router();


router.use(
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT, USER_ROLES.USER),
  checkModuleAccess("projects"),
);


router.patch(
  "/:id/progress",
  auth(USER_ROLES.TENANT, USER_ROLES.USER),
  validateRequest(ProjectValidation.updateProgressZodSchema),
  ProjectController.updateProjectProgress,
);


router
  .route("/")
  .post(
    auth(USER_ROLES.TENANT, USER_ROLES.SUPER_ADMIN),
    validateRequest(ProjectValidation.createProjectZodSchema),
    ProjectController.createProject,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT, USER_ROLES.USER),
    ProjectController.getAllProjects,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.TENANT, USER_ROLES.USER),
    ProjectController.getProjectById,
  )
  .patch(
    auth(USER_ROLES.TENANT, USER_ROLES.SUPER_ADMIN),
    validateRequest(ProjectValidation.updateProjectZodSchema),
    ProjectController.updateProject,
  )
  .delete(
    auth(USER_ROLES.TENANT, USER_ROLES.SUPER_ADMIN),
    ProjectController.deleteProject,
  );

export const ProjectRoutes = router;
