import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Email service utility
 * Migrated from backend/src/lib/email.ts
 */

// Create reusable SMTP client
const emailClient = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER, // yourgmail@gmail.com
    pass: process.env.SMTP_PASS, // app password (no spaces)
  },
});

/**
 * Send email via SMTP
 */
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const result = await emailClient.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: body, // HTML body allowed
      text: body, // fallback
    });

    logger.info("Email sent successfully", {
      to,
      subject,
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}
