import nodemailer from "nodemailer";
import config from "../config";
import { errorLogger, logger } from "../shared/logger";
import { ISendEmail } from "../types/email";

const isSecurePort = Number(config.email.port) === 465;

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port) || 587,
  secure: isSecurePort,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"SassFlow" <${config.email.from}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info("Mail send successfully", info.accepted);
    return info;
  } catch (error: any) {
    errorLogger.error("Email send failed:", {
      message: error?.message,
      code: error?.code,
      response: error?.response,
    });
    return null;
  }
};

export const emailHelper = {
  sendEmail,
  transporter,
};

