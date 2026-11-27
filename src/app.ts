import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { StatusCodes } from "http-status-codes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import path from "path";
import router from "./app/routes";

const app: Application = express();

// security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
);

//body parser
app.use(
  cors({
    origin: [
      "https://softlligence-frontend-task.vercel.app"
    ],
    credentials: true,
  }),
);

app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: true }));

//static assets & file retrieve
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/favicon.ico", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "favicon.ico"));
});

//router
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

// handle not found route
app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

//global error handle
app.use(globalErrorHandler);

export default app;
