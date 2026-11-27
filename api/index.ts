import app from "../src/app";
import mongoose from "mongoose";
import config from "../src/config";
import seedSuperAdmin from "../src/DB";

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    if (!config.database_url) {
      throw new Error("DATABASE_URL is not defined in environment variables!");
    }
    await mongoose.connect(config.database_url as string);
    isConnected = true;
    console.log("🚀 Database connected successfully");
    await seedSuperAdmin();
  } catch (error) {
    console.error("Failed to connect Database", error);
    throw error;
  }
};

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}

