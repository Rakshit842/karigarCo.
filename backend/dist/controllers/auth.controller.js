"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const config_1 = require("../config");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const email_1 = require("../utils/email");
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).max(50),
    lastName: zod_1.z.string().min(2).max(50),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain uppercase, lowercase, and number',
    }),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8),
});
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
};
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const data = registerSchema.parse(req.body);
    const existing = await database_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new AppError_1.AppError('Email already registered', 409);
    const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
    const emailVerifyToken = crypto_1.default.randomBytes(32).toString('hex');
    const user = await database_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            emailVerifyToken,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    // Send verification email
    const verifyLink = `${config_1.config.frontendUrl}/verify-email?token=${emailVerifyToken}`;
    await (0, email_1.sendEmail)({
        to: user.email,
        subject: 'Verify your KarigarCo. account',
        html: email_1.emailTemplates.verifyEmail(user.firstName, verifyLink),
    });
    res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user },
    });
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const data = loginSchema.parse(req.body);
    const user = await database_1.prisma.user.findUnique({
        where: { email: data.email },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            sellerProfile: { select: { id: true, status: true, shopName: true } },
        },
    });
    if (!user || !await bcryptjs_1.default.compare(data.password, user.passwordHash)) {
        throw new AppError_1.AppError('Invalid email or password', 401);
    }
    if (!user.isActive)
        throw new AppError_1.AppError('Account has been deactivated', 403);
    // Update last login
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, {
        httpOnly: true,
        secure: !config_1.config.isDev,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                sellerProfile: user.sellerProfile,
            },
        },
    });
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});
exports.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.query;
    if (!token)
        throw new AppError_1.AppError('Verification token required', 400);
    const user = await database_1.prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user)
        throw new AppError_1.AppError('Invalid or expired verification token', 400);
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerifyToken: null },
    });
    res.json({ success: true, message: 'Email verified successfully' });
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await database_1.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
        return res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetExpiry: expiry },
    });
    const resetLink = `${config_1.config.frontendUrl}/reset-password?token=${resetToken}`;
    await (0, email_1.sendEmail)({
        to: user.email,
        subject: 'Reset your KarigarCo. password',
        html: email_1.emailTemplates.resetPassword(user.firstName, resetLink),
    });
    res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const user = await database_1.prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            passwordResetExpiry: { gt: new Date() },
        },
    });
    if (!user)
        throw new AppError_1.AppError('Invalid or expired reset token', 400);
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    });
    res.json({ success: true, message: 'Password reset successfully' });
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await database_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            sellerProfile: {
                select: {
                    id: true,
                    shopName: true,
                    slug: true,
                    status: true,
                    isVerified: true,
                    logoUrl: true,
                    craftSpecialization: true,
                },
            },
        },
    });
    if (!user)
        throw new AppError_1.AppError('User not found', 404);
    res.json({ success: true, data: { user } });
});
//# sourceMappingURL=auth.controller.js.map