import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserService } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import config from "../../../config";
import { STATUS } from "../../../enums/user";

// register user
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

// update profile
const updateProfile = catchAsync(async (req, res) => {
  const user: any = req.user;
  if ("role" in req.body) {
    delete req.body.role;
  }
  if (req.body.password) {
    req.body.password = await bcrypt.hash(
      req.body.password,
      Number(config.bcrypt_salt_rounds),
    );
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
  const result = await UserService.getUsersFromDB(req.query);

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
  const result = await UserService.getUserByIdFromDB(id);

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

  const result = await UserService.updateUserStatusByIdToDB(id, status);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Status updated successfully",
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.deleteUserByIdFromD(id);

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
  getUsers,
  updateProfile,
  getUserById,
  updateUserStatusById,
  getMyProfile,
  deleteUserById,
  deleteProfile,
};
