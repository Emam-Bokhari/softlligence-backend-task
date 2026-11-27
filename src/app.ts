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

//static assets & file retrieve
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/favicon.ico", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "favicon.ico"));
});

//router
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SassFlow API — Server Operational</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #F8FAFC;
      color: #1E293B;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 24px;
      padding: 48px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 10px 30px -10px rgba(79, 57, 246, 0.08);
      text-align: center;
    }
    .logo-wrapper {
      margin-bottom: 24px;
      display: inline-block;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #EEF2FF;
      color: #4F39F6;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #4F39F6;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 12px;
      color: #1E293B;
    }
    h1 span {
      color: #4F39F6;
    }
    p {
      color: #475569;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 32px;
      text-align: left;
    }
    .grid-item {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
    }
    .grid-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .grid-value {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
    }
    .btn {
      display: inline-block;
      background: #4F39F6;
      color: #FFFFFF;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #4330D6;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-wrapper">
      <img src="https://res.cloudinary.com/dphkhbunv/image/upload/v1795795341/logo-icon_yq86ss.png" alt="SassFlow" width="80" height="80" style="display: block; margin: 0 auto; border-radius: 20px; box-shadow: 0 8px 24px rgba(79, 57, 246, 0.25);">
    </div>
    <div class="badge">
      <span class="badge-dot"></span>
      Backend API Operational
    </div>
    <h1>Welcome to <span>SassFlow</span></h1>
    <p>Multi-Tenant SaaS Project & Subscription Management Platform API. All micro-services and database connections are running normally.</p>
    <div class="grid">
      <div class="grid-item">
        <div class="grid-label">API Version</div>
        <div class="grid-value">v1.0.0 (REST)</div>
      </div>
      <div class="grid-item">
        <div class="grid-label">Protocol</div>
        <div class="grid-value">JSON / HTTPS</div>
      </div>
      <div class="grid-item">
        <div class="grid-label">Base Endpoint</div>
        <div class="grid-value">/api/v1</div>
      </div>
      <div class="grid-item">
        <div class="grid-label">Architecture</div>
        <div class="grid-value">Multi-Tenant Scoped</div>
      </div>
    </div>
    <a href="/api/v1" class="btn">Explore API Endpoints</a>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} SassFlow Platform. All rights reserved.
  </div>
</body>
</html>`);
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
