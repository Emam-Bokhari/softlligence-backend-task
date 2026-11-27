import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserService } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { STATUS } from "../../../enums/user";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.createUserToDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: result.message,
      data: result,
    });
  },
);

const createTeamMember = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createTeamMemberToDB(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Team member created successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const user: any = req.user;
  if ("role" in req.body) {
    delete req.body.role;
  }
  if ("password" in req.body) {
    delete req.body.password;
  }

  const result = await UserService.updateProfileToDB(user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsersFromDB(req.user, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getUserByIdFromDB(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully retrieve user by ID",
    data: result,
  });
});

const updateUserStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const status = (req.body?.status || STATUS.INACTIVE) as STATUS;

  const result = await UserService.updateUserStatusByIdToDB(
    req.user,
    id,
    status,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Status updated successfully",
    data: result,
  });
});

const updateTeamMember = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.updateTeamMemberByIdToDB(
    req.user,
    id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Team member updated successfully",
    data: result,
  });
});

const updateTenantSubscriptionByAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { subscriptionPlanId, subscriptionStatus } = req.body;
  const result = await UserService.updateTenantSubscriptionByAdminToDB(
    id,
    subscriptionPlanId,
    subscriptionStatus,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Tenant subscription updated successfully by Super Admin",
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.deleteUserByIdFromD(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User is deleted successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const { id: userId }: any = req.user;
  const result = await UserService.getMyProfileFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile data is retrieved successfully",
    data: result,
  });
});

const deleteProfile = catchAsync(async (req, res) => {
  const { id }: any = req.user;
  const { password } = req.body;

  const result = await UserService.deleteProfileFromDB(id, password);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile deleted successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  createTeamMember,
  getUsers,
  updateProfile,
  updateTeamMember,
  getUserById,
  updateUserStatusById,
  updateTenantSubscriptionByAdmin,
  getMyProfile,
  deleteUserById,
  deleteProfile,
};
