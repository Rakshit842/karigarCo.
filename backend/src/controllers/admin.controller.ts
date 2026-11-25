import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { getPaginationParams, paginationMeta } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../utils/email';
import { SellerStatus, ProductStatus } from '@prisma/client';
import { config } from '../config';

// Admin Dashboard Overview
export const getAdminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalCustomers,
    totalSellers,
    pendingSellerApplications,
    totalProducts,
    pendingProductApprovals,
    totalOrders,
    payments,
    commissions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'SELLER' } }),
    prisma.sellerProfile.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.order.count(),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.commission.aggregate({ _sum: { commissionAmount: true } }),
  ]);

  const gmv = Number(payments._sum.amount || 0);
  const platformRevenue = Number(commissions._sum.commissionAmount || 0);

  res.json({
    success: true,
    data: {
      totalCustomers,
      totalSellers,
      pendingSellerApplications,
      totalProducts,
      pendingProductApprovals,
      totalOrders,
      gmv,
      platformRevenue,
    },
  });
});

// Manage Sellers
export const listSellers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const status = req.query.status as SellerStatus | undefined;
  const search = req.query.search as string | undefined;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { shopName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [sellers, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
        verificationDocs: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sellerProfile.count({ where }),
  ]);

  res.json({ success: true, data: { sellers, meta: paginationMeta(total, page, limit) } });
});

export const updateSellerStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason } = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
    rejectionReason: z.string().optional(),
  }).parse(req.body);

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!seller) throw new AppError('Seller not found', 404);

  const updateData: any = { status };
  if (status === 'APPROVED') updateData.approvedAt = new Date();
  if (status === 'REJECTED') updateData.rejectionReason = rejectionReason;

  await prisma.$transaction([
    prisma.sellerProfile.update({ where: { id }, data: updateData }),
    ...(status === 'APPROVED'
      ? [prisma.user.update({ where: { id: seller.userId }, data: { role: 'SELLER' } })]
      : []),
  ]);

  // Send email notification
  if (status === 'APPROVED') {
    await sendEmail({
      to: seller.user.email,
      subject: 'Your KarigarCo. seller application has been approved!',
      html: emailTemplates.sellerApproved(seller.shopName),
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: `SELLER_${status}`,
      entity: 'SellerProfile',
      entityId: id,
      metadata: { rejectionReason },
    },
  });

  res.json({ success: true, message: `Seller ${status.toLowerCase()}` });
});

// Manage Products
export const listAllProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const status = req.query.status as ProductStatus | undefined;

  const where: any = {};
  if (status) where.status = status;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: { select: { shopName: true, slug: true } },
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: { products, meta: paginationMeta(total, page, limit) } });
});

export const updateProductApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason } = z.object({
    status: z.enum(['PUBLISHED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }).parse(req.body);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  const updateData: any = { status };
  if (status === 'PUBLISHED') updateData.approvedAt = new Date();
  if (status === 'REJECTED') updateData.rejectionReason = rejectionReason;

  await prisma.product.update({ where: { id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: `PRODUCT_${status}`,
      entity: 'Product',
      entityId: id,
    },
  });

  res.json({ success: true, message: `Product ${status.toLowerCase()}` });
});

export const toggleFeaturedProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);
  const updated = await prisma.product.update({
    where: { id },
    data: { isFeatured: !product.isFeatured },
  });
  res.json({ success: true, data: { product: updated } });
});

// Manage Orders
export const listAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: { select: { quantity: true, totalPrice: true, seller: { select: { shopName: true } } } },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: { orders, meta: paginationMeta(total, page, limit) } });
});

// Commission settings
export const getCommissionSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const sellers = await prisma.sellerProfile.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, shopName: true, commissionRate: true },
  });
  res.json({
    success: true,
    data: { defaultRate: config.defaultCommissionRate, sellers },
  });
});

export const updateCommissionRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sellerId, commissionRate } = z.object({
    sellerId: z.string(),
    commissionRate: z.number().min(0).max(100),
  }).parse(req.body);

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { commissionRate },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE_COMMISSION_RATE',
      entity: 'SellerProfile',
      entityId: sellerId,
      metadata: { commissionRate },
    },
  });

  res.json({ success: true, message: 'Commission rate updated' });
});

// Customer management
export const listCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['CUSTOMER', 'SELLER'] } },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, isEmailVerified: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { role: { in: ['CUSTOMER', 'SELLER'] } } }),
  ]);
  res.json({ success: true, data: { users, meta: paginationMeta(total, page, limit) } });
});

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'ADMIN') throw new AppError('Cannot deactivate admin', 403);

  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  res.json({ success: true, message: `User ${user.isActive ? 'deactivated' : 'reactivated'}` });
});

// Homepage content
export const getHomepageBanners = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const banners = await prisma.homepageBanner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: { banners } });
});

export const upsertBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, ...data } = req.body;
  const banner = id
    ? await prisma.homepageBanner.update({ where: { id }, data })
    : await prisma.homepageBanner.create({ data });
  res.json({ success: true, data: { banner } });
});

export const deleteBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.homepageBanner.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Banner deleted' });
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);
  res.json({ success: true, data: { logs, meta: paginationMeta(total, page, limit) } });
});
