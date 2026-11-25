import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { slugify, getPaginationParams, paginationMeta } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../utils/email';
import { ProductStatus, SellerStatus } from '@prisma/client';

const applySellerSchema = z.object({
  shopName: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  artisanStory: z.string().optional(),
  craftSpecialization: z.string().min(3),
  phone: z.string().min(10),
  businessAddress: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pinCode: z.string().regex(/^\d{6}$/),
});

const updateProfileSchema = z.object({
  shopName: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  artisanStory: z.string().optional(),
  craftSpecialization: z.string().optional(),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  phone: z.string().optional(),
  businessAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIFSC: z.string().optional(),
  upiId: z.string().optional(),
});

// Public: Get seller by slug
export const getSellerBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { createdAt: true } },
      products: {
        where: { status: ProductStatus.PUBLISHED },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          inventory: { select: { quantity: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!seller || seller.status !== SellerStatus.APPROVED) {
    throw new AppError('Seller not found', 404);
  }

  // Compute average ratings for products
  const productsWithRating = seller.products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return { ...p, avgRating, reviewCount: ratings.length };
  });

  res.json({ success: true, data: { seller: { ...seller, products: productsWithRating } } });
});

// Apply to become a seller
export const applySeller = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'CUSTOMER' && req.user!.role !== 'SELLER') {
    throw new AppError('Invalid account type', 400);
  }

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (existing) throw new AppError('You already have a seller profile', 409);

  const data = applySellerSchema.parse(req.body);
  const slug = slugify(data.shopName);

  const slugConflict = await prisma.sellerProfile.findUnique({ where: { slug } });
  if (slugConflict) throw new AppError('Shop name is already taken', 409);

  const seller = await prisma.sellerProfile.create({
    data: {
      ...data,
      slug,
      userId: req.user!.id,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Seller application submitted. We will review it shortly.',
    data: { seller },
  });
});

// Get own seller dashboard overview
export const getSellerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller || seller.status !== SellerStatus.APPROVED) {
    throw new AppError('Seller account not approved', 403);
  }

  const [
    totalProducts,
    pendingOrders,
    completedOrders,
    lowStockProducts,
    commissions,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.orderItem.count({ where: { sellerId, status: 'PENDING' } }),
    prisma.orderItem.count({ where: { sellerId, status: 'DELIVERED' } }),
    prisma.inventory.count({ where: { product: { sellerId }, quantity: { lte: 5, gt: 0 } } }),
    prisma.commission.findMany({
      where: { sellerId },
      select: { grossAmount: true, commissionAmount: true, netAmount: true },
    }),
    prisma.orderItem.findMany({
      where: { sellerId },
      include: { order: { select: { orderNumber: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const totalGross = commissions.reduce((s, c) => s + Number(c.grossAmount), 0);
  const totalCommission = commissions.reduce((s, c) => s + Number(c.commissionAmount), 0);
  const totalNet = commissions.reduce((s, c) => s + Number(c.netAmount), 0);

  res.json({
    success: true,
    data: {
      totalProducts,
      pendingOrders,
      completedOrders,
      lowStockProducts,
      earnings: { totalGross, totalCommission, totalNet },
      recentOrders,
    },
  });
});

// Get seller's own products
export const getSellerProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { page, limit, skip } = getPaginationParams(req.query);
  const status = req.query.status as ProductStatus | undefined;

  const where = { sellerId, ...(status && { status }) };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: { products, meta: paginationMeta(total, page, limit) } });
});

// Get seller's orders
export const getSellerOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { page, limit, skip } = getPaginationParams(req.query);
  const status = req.query.status as string | undefined;

  const where = { sellerId, ...(status && { status: status as any }) };
  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true, createdAt: true, address: true, user: { select: { email: true, firstName: true, lastName: true } } },
        },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.orderItem.count({ where }),
  ]);

  res.json({ success: true, data: { orders: items, meta: paginationMeta(total, page, limit) } });
});

// Update seller order item (ship / deliver)
export const updateOrderItemStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { id } = req.params;
  const { status, trackingNumber, trackingUrl } = req.body;

  const item = await prisma.orderItem.findFirst({ where: { id, sellerId } });
  if (!item) throw new AppError('Order item not found', 404);

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['PROCESSING'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
  };

  if (!allowedTransitions[item.status]?.includes(status)) {
    throw new AppError(`Cannot transition from ${item.status} to ${status}`, 400);
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;
  }
  if (status === 'DELIVERED') updateData.deliveredAt = new Date();

  const updated = await prisma.orderItem.update({ where: { id }, data: updateData });
  res.json({ success: true, data: { orderItem: updated } });
});

// Get seller earnings
export const getSellerEarnings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const commissions = await prisma.commission.findMany({
    where: { sellerId },
    include: {
      orderItem: {
        select: {
          productName: true,
          quantity: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const settlements = await prisma.sellerSettlement.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
  });

  const totalGross = commissions.reduce((s, c) => s + Number(c.grossAmount), 0);
  const totalCommission = commissions.reduce((s, c) => s + Number(c.commissionAmount), 0);
  const totalNet = commissions.reduce((s, c) => s + Number(c.netAmount), 0);
  const completedSettlements = settlements
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const pendingSettlements = totalNet - completedSettlements;

  res.json({
    success: true,
    data: {
      summary: { totalGross, totalCommission, totalNet, completedSettlements, pendingSettlements },
      commissions,
      settlements,
    },
  });
});

// Update seller store profile
export const updateSellerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const data = updateProfileSchema.parse(req.body);

  if (data.shopName) {
    const slug = slugify(data.shopName);
    const conflict = await prisma.sellerProfile.findFirst({
      where: { slug, id: { not: sellerId } },
    });
    if (conflict) throw new AppError('Shop name already taken', 409);
    (data as any).slug = slug;
  }

  const seller = await prisma.sellerProfile.update({
    where: { id: sellerId },
    data,
  });
  res.json({ success: true, data: { seller } });
});

// Get inventory overview
export const getInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const inventory = await prisma.inventory.findMany({
    where: { product: { sellerId } },
    include: {
      product: { select: { id: true, name: true, slug: true, status: true } },
    },
    orderBy: { quantity: 'asc' },
  });

  res.json({ success: true, data: { inventory } });
});

// Update stock
export const updateStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { productId, quantity } = z.object({
    productId: z.string(),
    quantity: z.number().int().min(0),
  }).parse(req.body);

  const product = await prisma.product.findFirst({ where: { id: productId, sellerId } });
  if (!product) throw new AppError('Product not found', 404);

  const inventory = await prisma.inventory.upsert({
    where: { productId },
    update: { quantity },
    create: { productId, quantity },
  });

  res.json({ success: true, data: { inventory } });
});

// Get seller profile (own)
export const getSellerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      verificationDocs: true,
    },
  });
  res.json({ success: true, data: { seller } });
});
