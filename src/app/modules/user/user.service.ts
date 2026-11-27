import { STATUS, USER_ROLES } from "../../../enums/user";
import { SUBSCRIPTION_STATUS } from "../../../enums/subscription";
import config from "../../../config";
import { TUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import QueryBuilder from "../../builder/queryBuilder";
import bcrypt from "bcrypt";
import { USER_SEARCHABLE_FIELDS } from "./user.constant";
import { AuthService } from "../auth/auth.service";
import { ISignUpData } from "../../../types/auth";
import { SubscriptionPlan } from "../subscriptionPlan/subscriptionPlan.model";
import { Types } from "mongoose";
import { emailHelper } from "../../../helpers/emailHelper";
import { emailTemplate } from "../../../shared/emailTemplate";

const createUserToDB = async (payload: ISignUpData) => {
  return await AuthService.signUpUserToDB(payload);
};

const createTeamMemberToDB = async (
  currentUser: JwtPayload,
  payload: Record<string, any>,
) => {
  if (currentUser.role !== USER_ROLES.TENANT) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only tenants can create team members for their organization!",
    );
  }

  const tenantId = currentUser.id;

  const tenant = await User.findOne({
    _id: tenantId,
    role: USER_ROLES.TENANT,
    isDeleted: { $ne: true },
  });

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found!");
  }

  if (
    !tenant.subscriptionPlanId ||
    tenant.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You must purchase an active subscription plan before adding team members!",
    );
  }

  const plan = await SubscriptionPlan.findOne({
    _id: tenant.subscriptionPlanId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!plan) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your subscription plan is invalid or inactive. Please contact support.",
    );
  }

  if (plan?.features?.maxUsers) {
    const currentMemberCount = await User.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: { $ne: true },
    });

    if (currentMemberCount >= plan.features.maxUsers) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `User limit reached! Your subscription plan allows a maximum of ${plan.features.maxUsers} users. Please upgrade your plan.`,
      );
    }
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const isExistUser = await User.findOne({ email: normalizedEmail });
  if (isExistUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "A user with this email already exists!",
    );
  }

  const newMember = await User.create({
    name: payload.name.trim(),
    email: normalizedEmail,
    password: payload.password,
    role: USER_ROLES.USER,
    gender: payload.gender,
    tenantId: new Types.ObjectId(tenantId),
    verified: true,
    status: STATUS.ACTIVE,
  });

  // send invitation email with credentials to the newly created team member
  const emailValues = {
    name: newMember.name,
    email: newMember.email,
    password: payload.password,
    tenantName: tenant.name || "Your Organization",
  };
  const memberEmailTemplate = emailTemplate.teamMemberInvitation(emailValues);
  emailHelper.sendEmail(memberEmailTemplate);

  return newMember;
};

const getMyProfileFromDB = async (userId: string) => {
  const result = await User.findById(userId)
    .populate("subscriptionPlanId")
    .select("-password -authentication");

  if (!result || result.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  let activePlan = result.subscriptionPlanId;
  if (result.role === USER_ROLES.USER && result.tenantId) {
    const tenant = await User.findById(result.tenantId).populate(
      "subscriptionPlanId",
    );
    if (tenant?.subscriptionPlanId) {
      activePlan = tenant.subscriptionPlanId;
    }
  }

  return {
    ...result.toObject(),
    activePlan,
  };
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Record<string, any>,
): Promise<Partial<TUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if ("password" in payload) {
    delete payload.password;
  }

  const updatePayload: Record<string, any> = {};
  if (payload.name) updatePayload.name = payload.name;
  if (payload.gender) updatePayload.gender = payload.gender;

  const updateDoc = await User.findOneAndUpdate({ _id: id }, updatePayload, {
    new: true,
  }).select("-password -authentication");

  return updateDoc;
};

const getUsersFromDB = async (
  currentUser: JwtPayload,
  query: Record<string, unknown>,
) => {
  const queryObj = { ...query };

  const filterConditions: Record<string, any> = { isDeleted: { $ne: true } };

  if (currentUser.role === USER_ROLES.TENANT) {
    filterConditions.tenantId = new Types.ObjectId(currentUser.id);
  } else if (currentUser.role === USER_ROLES.USER) {
    filterConditions.tenantId = new Types.ObjectId(currentUser.tenantId);
  }

  const queryBuilder = new QueryBuilder(
    User.find(filterConditions).select("-password -authentication") as any,
    queryObj,
  )
    .search(USER_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [users, meta] = await Promise.all([
    queryBuilder.modelQuery.lean(),
    queryBuilder.countTotal(),
  ]);

  return {
    data: users,
    meta,
  };
};

const getUserByIdFromDB = async (currentUser: JwtPayload, id: string) => {
  const user = await User.findById(id)
    .populate("subscriptionPlanId")
    .select("-password -authentication");

  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No user is found by this ID");
  }

  if (currentUser.role === USER_ROLES.TENANT) {
    const isSelf = user._id.toString() === currentUser.id;
    const isMyMember = user.tenantId?.toString() === currentUser.id;
    if (!isSelf && !isMyMember) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Access denied! This user does not belong to your organization.",
      );
    }
  } else if (currentUser.role === USER_ROLES.USER) {
    const isSelf = user._id.toString() === currentUser.id;
    const isSameTenant = user.tenantId?.toString() === currentUser.tenantId;
    if (!isSelf && !isSameTenant) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Access denied! This user is outside your organization.",
      );
    }
  }

  return user;
};

const updateUserStatusByIdToDB = async (
  currentUser: JwtPayload,
  id: string,
  status: STATUS,
) => {
  if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Status must be either 'active' or 'inactive'",
    );
  }

  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No user is found by this ID");
  }

  if (currentUser.role === USER_ROLES.TENANT) {
    if (user.tenantId?.toString() !== currentUser.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You can only change the status of members within your own organization!",
      );
    }
  }

  const result = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  ).select("-password -authentication");

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update status");
  }

  return result;
};

const updateTeamMemberByIdToDB = async (
  currentUser: JwtPayload,
  id: string,
  payload: Record<string, any>,
) => {
  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
  }

  if (currentUser.role === USER_ROLES.TENANT) {
    if (user.tenantId?.toString() !== currentUser.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You can only update members within your own organization!",
      );
    }
  }

  const updatePayload: Record<string, any> = {};
  if (payload.name) updatePayload.name = payload.name;
  if (payload.gender) updatePayload.gender = payload.gender;
  if (payload.password) {
    updatePayload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds),
    );
  }

  const result = await User.findByIdAndUpdate(id, updatePayload, {
    new: true,
  }).select("-password -authentication");

  return result;
};

const deleteUserByIdFromD = async (currentUser: JwtPayload, id: string) => {
  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
  }

  if (currentUser.role === USER_ROLES.TENANT) {
    if (user.tenantId?.toString() !== currentUser.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You can only delete members within your own organization!",
      );
    }
  }

  const result = await User.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, status: STATUS.INACTIVE } },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete user");
  }

  return result;
};

const updateTenantSubscriptionByAdminToDB = async (
  tenantId: string,
  subscriptionPlanId: string,
  subscriptionStatus?: SUBSCRIPTION_STATUS,
) => {
  const tenant = await User.findOne({
    _id: tenantId,
    role: USER_ROLES.TENANT,
    isDeleted: { $ne: true },
  });

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant account not found!");
  }

  const plan = await SubscriptionPlan.findOne({
    _id: subscriptionPlanId,
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!plan) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Subscription plan not found or inactive!",
    );
  }

  const result = await User.findByIdAndUpdate(
    tenantId,
    {
      subscriptionPlanId: new Types.ObjectId(subscriptionPlanId),
      subscriptionStatus: subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE,
    },
    { new: true },
  )
    .populate("subscriptionPlanId")
    .select("-password -authentication");

  return result;
};

const deleteProfileFromDB = async (id: string, password?: string) => {
  const user = await User.findById(id).select("+password");
  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (user.password && password) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Password is incorrect!");
    }
  }

  const result = await User.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, status: STATUS.INACTIVE } },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete profile");
  }

  return result;
};

export const UserService = {
  createUserToDB,
  createTeamMemberToDB,
  getUsersFromDB,
  getUserByIdFromDB,
  getMyProfileFromDB,
  updateProfileToDB,
  updateTeamMemberByIdToDB,
  updateUserStatusByIdToDB,
  updateTenantSubscriptionByAdminToDB,
  deleteUserByIdFromD,
  deleteProfileFromDB,
};
