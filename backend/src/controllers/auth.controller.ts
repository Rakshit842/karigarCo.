import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendEmail, emailTemplates } from '../utils/email';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  }),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const generateToken = (payload: { id: string; email: string; role: string }) => {
  return jwt.sign(payload, config.jwtSecret as jwt.Secret, { expiresIn: '7d' });
};

export const register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(data.password, 12);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
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
  const verifyLink = `${config.frontendUrl}/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your KarigarCo. account',
    html: emailTemplates.verifyEmail(user.firstName, verifyLink),
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
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

  if (!user || !await bcrypt.compare(data.password, user.passwordHash)) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) throw new AppError('Account has been deactivated', 403);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.cookie('token', token, {
    httpOnly: true,
    secure: !config.isDev,
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

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.query as { token: string };
  if (!token) throw new AppError('Verification token required', 400);

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new AppError('Invalid or expired verification token', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });

  res.json({ success: true, message: 'Email verified successfully' });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpiry: expiry },
  });

  const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your KarigarCo. password',
    html: emailTemplates.resetPassword(user.firstName, resetLink),
  });

  res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  });

  res.json({ success: true, message: 'Password reset successfully' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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

  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user } });
});
