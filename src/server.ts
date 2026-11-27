import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { errorLogger, logger } from "./shared/logger";
import seedSuperAdmin from "./DB";

//uncaught exception
process.on("uncaughtException", (error) => {
  errorLogger.error("uncaughtException Detected", error);
  process.exit(1);
});

let server: any;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    logger.info("🚀 Database connected successfully");

    // create super admin
    await seedSuperAdmin();

    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    if (!process.env.VERCEL) {
      server = app.listen(port, config.ip_address as string, () => {
        logger.info(`♻️  SassFlow API listening on port:${config.port}`);
      });
    }
  } catch (error) {
    errorLogger.error("🤢 Failed to connect Database", error);
  }

  //handle unhandledRejection
  process.on("unhandledRejection", (error) => {
    if (server) {
      server.close(() => {
        errorLogger.error("UnhandledRejection Detected", error);
        console.error((error as Error).stack);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on("SIGTERM", () => {
  logger.info("SIGTERM IS RECEIVE");
  if (server) {
    server.close();
  }
});

export default app;
