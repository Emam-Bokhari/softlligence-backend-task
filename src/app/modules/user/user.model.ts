import { model, Schema } from "mongoose";
import { GENDER, STATUS, USER_ROLES } from "../../../enums/user";
import { IUserModel, TUser } from "./user.interface";
import bcrypt from "bcrypt";
import config from "../../../config";

const userSchema = new Schema<TUser, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 6,
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
        authType: {
          type: String,
          default: null,
        },
      },
      select: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.id;
        delete ret.password;
        delete ret.authentication;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.id;
        delete ret.password;
        delete ret.authentication;
        return ret;
      },
    },
  },
);

// exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  return await User.findOne({ _id: id, isDeleted: { $ne: true } });
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  return await User.findOne({ email, isDeleted: { $ne: true } });
};

// is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

// hash password pre-save
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(
      this.password as string,
      Number(config.bcrypt_salt_rounds),
    );
  }
  next();
});

userSchema.index({ role: 1 });

export const User = model<TUser, IUserModel>("User", userSchema);
