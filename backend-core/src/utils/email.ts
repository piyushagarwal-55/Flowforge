import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Email service utility
 * Migrated from backend/src/lib/email.ts
 */

// Create reusable SMTP client with timeout configuration
const emailClient = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER, // yourgmail@gmail.com
    pass: process.env.SMTP_PASS, // app password (no spaces)
  },
  // Add connection and socket timeouts
  connectionTimeout: 10000, // 10 seconds to connect
  greetingTimeout: 10000, // 10 seconds for greeting
  socketTimeout: 10000, // 10 seconds for socket inactivity
});

/**
 * Send email via SMTP with timeout
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
    // Add 10 second timeout for email sending
    const sendPromise = emailClient.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: body, // HTML body allowed
      text: body, // fallback
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout after 10 seconds')), 10000);
    });

    const result = await Promise.race([sendPromise, timeoutPromise]) as any;

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

    // Don't throw error - just log and return failure
    // This prevents email failures from breaking the entire workflow
    return {
      success: false,
      error: error.message,
    };
  }
}
