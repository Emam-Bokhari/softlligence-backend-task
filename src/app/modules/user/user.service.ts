import { STATUS } from "../../../enums/user";
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

// --- USER SERVICES ---
const createUserToDB = async (payload: ISignUpData) => {
  return await AuthService.signUpUserToDB(payload);
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

const getUsersFromDB = async (query: Record<string, unknown>) => {
  const queryObj = { ...query };

  const queryBuilder = new QueryBuilder(
    User.find({ isDeleted: { $ne: true } }).select("-password -authentication") as any,
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
  getUsersFromDB,
  getUserByIdFromDB,
  getMyProfileFromDB,
  updateProfileToDB,
  updateUserStatusByIdToDB,
  deleteUserByIdFromD,
  deleteProfileFromDB,
};
