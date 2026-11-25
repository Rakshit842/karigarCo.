import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: config.smtp.from, to, subject, html });
    logger.info(`[Email] Sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`[Email] Failed to send to ${to}:`, error);
  }
};

export const emailTemplates = {
  verifyEmail: (name: string, link: string) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2d5016; padding: 24px; text-align: center;">
        <h1 style="color: #d4a853; margin: 0; font-size: 24px;">KarigarCo.</h1>
        <p style="color: #a3c585; margin: 4px 0 0; font-size: 12px;">by Viraasat</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2328;">Verify your email, ${name}</h2>
        <p style="color: #57606a;">Click the button below to verify your email address and activate your account.</p>
        <a href="${link}" style="display: inline-block; background: #2d5016; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">Verify Email</a>
        <p style="color: #57606a; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    </div>`,

  resetPassword: (name: string, link: string) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2d5016; padding: 24px; text-align: center;">
        <h1 style="color: #d4a853; margin: 0; font-size: 24px;">KarigarCo.</h1>
        <p style="color: #a3c585; margin: 4px 0 0; font-size: 12px;">by Viraasat</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2328;">Reset your password, ${name}</h2>
        <p style="color: #57606a;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display: inline-block; background: #c0392b; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">Reset Password</a>
        <p style="color: #57606a; font-size: 13px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    </div>`,

  orderConfirmation: (name: string, orderNumber: string, total: number) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2d5016; padding: 24px; text-align: center;">
        <h1 style="color: #d4a853; margin: 0; font-size: 24px;">KarigarCo.</h1>
        <p style="color: #a3c585; margin: 4px 0 0; font-size: 12px;">by Viraasat</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2328;">Order Confirmed! 🎉</h2>
        <p style="color: #57606a;">Hi ${name}, your order <strong>#${orderNumber}</strong> has been confirmed.</p>
        <p style="color: #57606a;">Total: <strong>₹${total.toLocaleString('en-IN')}</strong></p>
        <p style="color: #57606a;">Our artisans are preparing your handcrafted products with care. We'll notify you when your order ships.</p>
      </div>
    </div>`,

  sellerApproved: (shopName: string) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2d5016; padding: 24px; text-align: center;">
        <h1 style="color: #d4a853; margin: 0; font-size: 24px;">KarigarCo.</h1>
        <p style="color: #a3c585; margin: 4px 0 0; font-size: 12px;">by Viraasat</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2328;">Welcome to KarigarCo., ${shopName}! 🎊</h2>
        <p style="color: #57606a;">Congratulations! Your seller application has been approved. You can now log in to your dashboard and start listing your handcrafted products.</p>
        <a href="${config.frontendUrl}/seller/dashboard" style="display: inline-block; background: #2d5016; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>`,
};
