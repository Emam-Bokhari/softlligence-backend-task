import { STATUS, USER_ROLES } from "../../../enums/user";
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

// --- USER SERVICES ---
const createUserToDB = async (payload: ISignUpData) => {
  return await AuthService.signUpUserToDB(payload);
};

const createTeamMemberToDB = async (
  currentUser: JwtPayload,
  payload: Record<string, any>,
) => {
  const tenantId =
    currentUser.role === USER_ROLES.TENANT
      ? currentUser.id
      : payload.tenantId || currentUser.tenantId;

  if (!tenantId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Tenant ID is required to create a team member!",
    );
  }

  // 1. Fetch Tenant details
  const tenant = await User.findOne({
    _id: tenantId,
    role: USER_ROLES.TENANT,
    isDeleted: { $ne: true },
  });

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant not found!");
  }

  // 2. Feature Gating: Check subscription plan limit for users
  if (tenant.subscriptionPlanId) {
    const plan = await SubscriptionPlan.findOne({
      _id: tenant.subscriptionPlanId,
      isActive: true,
      isDeleted: { $ne: true },
    });

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
  }

  // 3. Check email uniqueness
  const normalizedEmail = payload.email.trim().toLowerCase();
  const isExistUser = await User.findOne({ email: normalizedEmail });
  if (isExistUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "A user with this email already exists!",
    );
  }

  // 4. Create user under this tenant
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

  return newMember;
};

const getMyProfileFromDB = async (userId: string) => {
  const result = await User.findById(userId).select(
    "-password -authentication",
  );

  if (!result || result.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
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

  const updatePayload: Record<string, any> = {};
  if (payload.name) updatePayload.name = payload.name;
  if (payload.gender) updatePayload.gender = payload.gender;
  if (payload.password) updatePayload.password = payload.password;

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

  // Strict Multi-Tenant Query Isolation:
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

const getUserByIdFromDB = async (id: string) => {
  const user = await User.findById(id).select("-password -authentication");

  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No user is found by this ID");
  }

  return user;
};

const updateUserStatusByIdToDB = async (id: string, status: STATUS) => {
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

const deleteUserByIdFromD = async (id: string) => {
  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
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
  updateUserStatusByIdToDB,
  deleteUserByIdFromD,
  deleteProfileFromDB,
};
