import express, { Application, Request, Response } from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import path from "path";
import router from "./app/routes";

const app: Application = express();

//body parser
app.use(
  cors({
    origin: [
      "http://10.10.26.182:3000",
      "http://10.10.26.182:3001",
      "http://10.10.26.182:3002",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
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

//file retrieve
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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
