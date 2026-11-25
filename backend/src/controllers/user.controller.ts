import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pinCode: z.string().regex(/^\d{6}$/),
  isDefault: z.boolean().optional(),
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatarUrl: true, role: true, isEmailVerified: true, createdAt: true,
    },
  });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user } });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatarUrl: true, role: true,
    },
  });
  res.json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ success: true, message: 'Password changed successfully' });
});

export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ success: true, data: { addresses } });
});

export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = addressSchema.parse(req.body);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: { ...data, userId: req.user!.id },
  });
  res.status(201).json({ success: true, data: { address } });
});

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = addressSchema.parse(req.body);

  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) throw new AppError('Address not found', 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.id, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({ where: { id }, data });
  res.json({ success: true, data: { address } });
});

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) throw new AppError('Address not found', 404);

  await prisma.address.delete({ where: { id } });
  res.json({ success: true, message: 'Address deleted' });
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          seller: { select: { shopName: true } },
        },
      },
      payment: { select: { status: true, method: true } },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { orders } });
});

export const getOrderDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          seller: { select: { shopName: true, slug: true } },
        },
      },
      payment: true,
      address: true,
    },
  });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, data: { order } });
});

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              seller: { select: { shopName: true, slug: true } },
              inventory: { select: { quantity: true } },
            },
          },
        },
      },
    },
  });
  res.json({ success: true, data: { items: wishlist?.items || [] } });
});

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: { notifications } });
});

export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'Notification marked as read' });
});
