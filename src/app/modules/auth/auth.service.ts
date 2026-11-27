import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelper } from "../../../helpers/jwtHelper";
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  ISignUpData,
  IVerifyEmail,
} from "../../../types/auth";
import { User } from "../user/user.model";
import cryptoToken from "../../../util/cryptoToken";
import { ResetToken } from "../resetToken/resetToken.model";
import { emailHelper } from "../../../helpers/emailHelper";
import generateOTP from "../../../util/generateOTP";
import { emailTemplate } from "../../../shared/emailTemplate";
import { STATUS, USER_ROLES } from "../../../enums/user";
import { TUser } from "../user/user.interface";

// ========================== Sign Up ===========================
const signUpUserToDB = async (payload: ISignUpData) => {
  const { email, password, name } = payload;

  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required!");
  }
  if (!password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required!");
  }
  if (!name) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Name is required!");
  }

  const role =
    payload.role && Object.values(USER_ROLES).includes(payload.role as USER_ROLES)
      ? (payload.role as USER_ROLES)
      : USER_ROLES.USER;

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const isExistUser = await User.findOne({ email: normalizedEmail });
  if (isExistUser) {
    if (isExistUser.verified) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "This email is already registered!",
      );
    }
    // Remove stale unverified user to allow clean re-registration
    await User.deleteOne({ _id: isExistUser._id });
  }

  // Generate 6-digit OTP
  const otp = generateOTP();

  const baseUserPayload: Partial<TUser> = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    gender: payload.gender,
    verified: false,
    status: STATUS.ACTIVE,
    authentication: {
      oneTimeCode: Number(otp),
      expireAt: new Date(Date.now() + 5 * 60000), // 5 minutes validity
      isResetPassword: false,
    },
  };

  const newUser = await User.create(baseUserPayload);

  if (!newUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Failed to create user account!",
    );
  }

  // Send verification email
  const emailValues = {
    name: newUser.name,
    otp: Number(otp),
    email: newUser.email,
  };
  const accountEmailTemplate = emailTemplate.createAccount(emailValues);
  emailHelper.sendEmail(accountEmailTemplate);

  // Generate token
  const token = jwtHelper.createToken(
    {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  const populatedUser = await User.findById(newUser._id).select(
    "-password -authentication",
  );

  return {
    message:
      "Your account has been successfully created. Please verify your email with the OTP sent to your inbox.",
    token,
    user: populatedUser || newUser,
  };
};

// ========================== Login ===========================
const loginUserFromDB = async (payload: ILoginData) => {
  const { email, password } = payload;
  const cleanInput = email ? email.trim() : "";
  const normalizedEmail = cleanInput.toLowerCase();

  const isExistUser = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // check verification status
  if (!isExistUser.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please verify your account before logging in.",
    );
  }

  // check active status
  if (isExistUser.status === STATUS.INACTIVE) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been deactivated. Please contact support.",
    );
  }

  // check password
  if (
    password &&
    !(await User.isMatchPassword(password, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  // create access token
  const createToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  // create refresh token
  const refreshToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
    },
    config.jwt.jwtRefreshSecret as Secret,
    config.jwt.jwtRefreshExpiresIn || "30d",
  );

  return {
    token: createToken,
    refreshToken,
    data: isExistUser,
  };
};

// ========================== Forget Password ===========================
const forgetPasswordToDB = async (email: string) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const isExistUser = await User.findOne({ email: normalizedEmail });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const otp = generateOTP();
  const value = {
    otp: Number(otp),
    email: isExistUser.email,
  };

  const forgetPassword = emailTemplate.resetPassword(value);
  emailHelper.sendEmail(forgetPassword);

  const authentication = {
    oneTimeCode: Number(otp),
    expireAt: new Date(Date.now() + 5 * 60000),
    isResetPassword: false,
  };

  await User.findOneAndUpdate(
    { _id: isExistUser._id },
    { $set: { authentication } },
  );

  return { message: "A password reset OTP has been sent to your email." };
};

// ========================== Verify Email / OTP ===========================
const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;
  const normalizedEmail = email?.trim().toLowerCase();
  const isExistUser = await User.findOne({ email: normalizedEmail }).select(
    "+authentication",
  );

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (!oneTimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please provide the OTP code sent to your email.",
    );
  }

  if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP code!");
  }

  const date = new Date();
  if (
    isExistUser.authentication?.expireAt &&
    date > isExistUser.authentication.expireAt
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "OTP code has expired. Please request a new one.",
    );
  }

  let message;
  let data;

  if (!isExistUser.verified) {
    // Signup verification flow
    const updatedUser = await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        verified: true,
        authentication: {
          oneTimeCode: null,
          expireAt: null,
          isResetPassword: false,
        },
      },
      { new: true },
    );

    const token = jwtHelper.createToken(
      {
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string,
    );

    const refreshToken = jwtHelper.createToken(
      {
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
      },
      config.jwt.jwtRefreshSecret as Secret,
      config.jwt.jwtRefreshExpiresIn || "30d",
    );

    message = "Email verified successfully.";
    data = {
      token,
      refreshToken,
      user: updatedUser,
    };
  } else {
    // Forgot password flow
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        authentication: {
          isResetPassword: true,
          oneTimeCode: null,
          expireAt: null,
        },
      },
    );

    const createToken = cryptoToken();
    await ResetToken.create({
      user: isExistUser._id,
      token: createToken,
      expireAt: new Date(Date.now() + 5 * 60000),
    });

    message =
      "Verification successful. Please securely use this token to reset your password.";
    data = createToken;
  }

  return { data, message };
};

// ========================== Reset Password ===========================
const resetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword,
) => {
  const { newPassword, confirmPassword } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Reset token is required!");
  }

  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
  }

  const isExistUser = await User.findById(isExistToken.user).select(
    "+authentication",
  );
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to change the password. Please initiate 'Forgot Password' again.",
    );
  }

  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Reset token expired. Please initiate 'Forgot Password' again.",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password and confirm password do not match!",
    );
  }

  if (!newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "New password is required!");
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await User.findOneAndUpdate(
    { _id: isExistToken.user },
    {
      password: hashPassword,
      authentication: {
        isResetPassword: false,
        oneTimeCode: null,
        expireAt: null,
      },
    },
    { new: true },
  );

  await ResetToken.deleteOne({ token });

  return { message: "Password reset successfully." };
};

// ========================== Change Password ===========================
const changePasswordToDB = async (
  user: JwtPayload,
  payload: IChangePassword,
) => {
  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(user.id).select("+password");
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (
    currentPassword &&
    !(await User.isMatchPassword(currentPassword, isExistUser.password))
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Current password is incorrect!",
    );
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from current password!",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password and confirm password do not match!",
    );
  }

  if (!newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "New password is required!");
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await User.findOneAndUpdate(
    { _id: user.id },
    { password: hashPassword },
    { new: true },
  );
};

// ========================== Refresh Access Token ===========================
const newAccessTokenToUser = async (token: string) => {
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required!");
  }

  const verifyUser = jwtHelper.verifyToken(
    token,
    config.jwt.jwtRefreshSecret as Secret,
  );

  const isExistUser = await User.findById(verifyUser?.id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access!");
  }

  const accessToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  return { accessToken };
};

// ========================== Resend Verification OTP ===========================
const resendVerificationEmailToDB = async (email: string) => {
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required!");
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (!existingUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this email does not exist!",
    );
  }

  const otp = generateOTP();

  if (existingUser.verified) {
    const emailValues = {
      otp: Number(otp),
      email: existingUser.email,
    };
    const resetPasswordTemplate = emailTemplate.resetPassword(emailValues);
    emailHelper.sendEmail(resetPasswordTemplate);
  } else {
    const emailValues = {
      name: existingUser.name,
      otp: Number(otp),
      email: existingUser.email,
    };
    const accountEmailTemplate = emailTemplate.createAccount(emailValues);
    emailHelper.sendEmail(accountEmailTemplate);
  }

  const authentication = {
    oneTimeCode: Number(otp),
    expireAt: new Date(Date.now() + 5 * 60000),
    isResetPassword: false,
  };

  await User.findOneAndUpdate(
    { _id: existingUser._id },
    { $set: { authentication } },
    { new: true },
  );

  return {
    message: "A new OTP verification code has been sent to your email.",
  };
};

// ========================== Delete User Account ===========================
const deleteUserFromDB = async (user: JwtPayload, password?: string) => {
  const isExistUser = await User.findById(user.id).select("+password");
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (
    isExistUser.password &&
    password &&
    !(await User.isMatchPassword(password, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  await User.findByIdAndUpdate(
    user.id,
    { $set: { isDeleted: true, status: STATUS.INACTIVE } },
    { new: true },
  );
  return;
};

export const AuthService = {
  signUpUserToDB,
  loginUserFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  verifyEmailToDB,
  changePasswordToDB,
  newAccessTokenToUser,
  resendVerificationEmailToDB,
  deleteUserFromDB,
};
