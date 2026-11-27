import { User } from "../app/modules/user/user.model";
import { SubscriptionPlan } from "../app/modules/subscriptionPlan/subscriptionPlan.model";
import config from "../config";
import { STATUS, USER_ROLES } from "../enums/user";
import { PLAN_DURATION } from "../enums/subscription";
import { logger } from "../shared/logger";

const superUser = {
  name: "Super Admin",
  role: USER_ROLES.SUPER_ADMIN,
  email: config.admin.email,
  password: config.admin.password,
  verified: true,
  status: STATUS.ACTIVE,
};

const defaultPlans = [
  {
    name: "Free Starter",
    description: "Basic plan for small teams to get started",
    price: 0,
    duration: PLAN_DURATION.MONTHLY,
    features: {
      maxUsers: 3,
      maxProjects: 3,
      canUpdateProgress: true,
      allowedModules: ["projects"],
    },
    isActive: true,
  },
  {
    name: "Professional",
    description: "For growing teams needing more capacity",
    price: 29,
    duration: PLAN_DURATION.MONTHLY,
    features: {
      maxUsers: 15,
      maxProjects: 20,
      canUpdateProgress: true,
      allowedModules: ["projects", "analytics"],
    },
    isActive: true,
  },
  {
    name: "Enterprise",
    description: "Enterprise grade with highest limits",
    price: 99,
    duration: PLAN_DURATION.YEARLY,
    features: {
      maxUsers: 100,
      maxProjects: 200,
      canUpdateProgress: true,
      allowedModules: ["projects", "analytics", "reports"],
    },
    isActive: true,
  },
];

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

  // Seed default subscription plans if none exist
  const existingPlansCount = await SubscriptionPlan.countDocuments({
    isDeleted: { $ne: true },
  });

  if (existingPlansCount === 0) {
    await SubscriptionPlan.insertMany(defaultPlans);
    logger.info("✔ Default subscription plans seeded successfully!");
  }
};

export default seedSuperAdmin;
