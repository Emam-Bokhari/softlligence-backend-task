import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getAdminStatsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Admin statistics retrieved successfully",
    data: result,
  });
});

const getTenantStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getTenantStatsFromDB(req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Tenant statistics retrieved successfully",
    data: result,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getUserStatsFromDB(req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User statistics retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getAdminStats,
  getTenantStats,
  getUserStats,
};
