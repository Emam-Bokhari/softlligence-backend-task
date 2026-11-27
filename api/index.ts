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
    await mongoose.connect(config.database_url as string);
    isConnected = true;
    console.log("🚀 Database connected successfully");
    await seedSuperAdmin();
  } catch (error) {
    console.error("Failed to connect Database", error);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

export default app;
