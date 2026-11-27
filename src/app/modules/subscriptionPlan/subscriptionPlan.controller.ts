import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SubscriptionPlanService } from "./subscriptionPlan.service";

const createSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionPlanService.createSubscriptionPlanToDB(
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Subscription plan created successfully",
      data: result,
    });
  },
);

const getAllSubscriptionPlans = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await SubscriptionPlanService.getAllSubscriptionPlansFromDB(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Subscription plans retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

const getSubscriptionPlanById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await SubscriptionPlanService.getSubscriptionPlanByIdFromDB(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Subscription plan retrieved successfully",
      data: result,
    });
  },
);

const updateSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await SubscriptionPlanService.updateSubscriptionPlanToDB(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Subscription plan updated successfully",
      data: result,
    });
  },
);

const deleteSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result =
      await SubscriptionPlanService.deleteSubscriptionPlanFromDB(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Subscription plan deleted successfully",
      data: result,
    });
  },
);

export const SubscriptionPlanController = {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
};
