import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProjectService } from "./project.service";

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProjectToDB(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Project created successfully",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getAllProjectsFromDB(req.user, req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Projects retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProjectService.getProjectByIdFromDB(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Project retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProjectService.updateProjectToDB(req.user, id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Project updated successfully",
    data: result,
  });
});

const updateProjectProgress = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { progress, status } = req.body;
    const result = await ProjectService.updateProjectProgressToDB(
      req.user,
      id,
      progress,
      status,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Project progress updated successfully",
      data: result,
    });
  },
);

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProjectService.deleteProjectFromDB(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Project deleted successfully",
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateProjectProgress,
  deleteProject,
};
