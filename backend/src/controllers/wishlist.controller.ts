import { Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

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
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  res.json({ success: true, data: { items: wishlist?.items || [] } });
});

export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  if (!productId) throw new AppError('Product ID required', 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found', 404);

  let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.id } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId: req.user!.id } });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  if (existing) {
    return res.json({ success: true, message: 'Already in wishlist' });
  }

  const item = await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });

  res.status(201).json({ success: true, data: { item } });
});

export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.id } });
  if (!wishlist) throw new AppError('Wishlist not found', 404);

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });

  res.json({ success: true, message: 'Removed from wishlist' });
});
