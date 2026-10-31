
import nodemailer from 'nodemailer';

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = process.env.SMTP_SECURE?.trim().toLowerCase() === 'true';

  if (!host || !process.env.SMTP_PORT || !user || !pass || !Number.isFinite(port) || port <= 0) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailParams): Promise<void> => {
  // Read the environment at send time rather than module import time.
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error(
      'SMTP is not configured. Check SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in the backend .env file.'
    );
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim(),
    to,
    subject,
    html,
  });
};
