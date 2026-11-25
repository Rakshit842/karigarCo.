"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const logger_1 = require("./logger");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtp.host,
    port: config_1.config.smtp.port,
    secure: config_1.config.smtp.secure,
    auth: {
        user: config_1.config.smtp.user,
        pass: config_1.config.smtp.pass,
    },
});
const sendEmail = async ({ to, subject, html }) => {
    if (!config_1.config.smtp.user || !config_1.config.smtp.pass) {
        logger_1.logger.warn(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({ from: config_1.config.smtp.from, to, subject, html });
        logger_1.logger.info(`[Email] Sent to ${to}: ${subject}`);
    }
    catch (error) {
        logger_1.logger.error(`[Email] Failed to send to ${to}:`, error);
    }
};
exports.sendEmail = sendEmail;
exports.emailTemplates = {
    verifyEmail: (name, link) => `
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
    resetPassword: (name, link) => `
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
    orderConfirmation: (name, orderNumber, total) => `
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
    sellerApproved: (shopName) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2d5016; padding: 24px; text-align: center;">
        <h1 style="color: #d4a853; margin: 0; font-size: 24px;">KarigarCo.</h1>
        <p style="color: #a3c585; margin: 4px 0 0; font-size: 12px;">by Viraasat</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2328;">Welcome to KarigarCo., ${shopName}! 🎊</h2>
        <p style="color: #57606a;">Congratulations! Your seller application has been approved. You can now log in to your dashboard and start listing your handcrafted products.</p>
        <a href="${config_1.config.frontendUrl}/seller/dashboard" style="display: inline-block; background: #2d5016; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>`,
};
//# sourceMappingURL=email.js.map