import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    // Dev fallback: log emails to console instead of failing, so auth flows
    // are still testable without real SMTP credentials configured.
    logger.warn("SMTP not configured — emails will be logged to console instead of sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const t = getTransporter();

  if (!t) {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`, { html });
    return;
  }

  await t.sendMail({ from: env.EMAIL_FROM, to, subject, html });
}

export function verificationEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to DailySpark, ${name}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <p><a href="${verifyUrl}" style="background:#3366ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
      <p>Or paste this link into your browser: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    </div>
  `;
}

export function passwordResetEmailTemplate(name: string, resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Hi ${name}, we received a request to reset your DailySpark password.</p>
      <p><a href="${resetUrl}" style="background:#3366ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p>Or paste this link into your browser: ${resetUrl}</p>
      <p>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
    </div>
  `;
}
