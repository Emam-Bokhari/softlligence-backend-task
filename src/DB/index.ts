import { User } from "../app/modules/user/user.model";
import config from "../config";
import { STATUS, USER_ROLES } from "../enums/user";
import { logger } from "../shared/logger";

const superUser = {
  name: "Super Admin",
  role: USER_ROLES.SUPER_ADMIN,
  email: config.admin.email,
  password: config.admin.password,
  verified: true,
  status: STATUS.ACTIVE,
};

const seedSuperAdmin = async () => {
  const existingUser = await User.findOne({
    email: config.admin.email,
  });

  if (!existingUser) {
    await User.create(superUser);
    logger.info("✔ Super admin created successfully!");
  } else if (existingUser.role !== USER_ROLES.SUPER_ADMIN) {
    existingUser.role = USER_ROLES.SUPER_ADMIN;
    existingUser.verified = true;
    await existingUser.save();
    logger.info("✔ Existing user promoted to Super Admin!");
  } else {
    logger.info("✔ Super Admin already exists.");
  }
};

export default seedSuperAdmin;
