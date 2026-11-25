import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
});

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = reviewSchema.parse(req.body);

  // Check if user has purchased this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: data.productId,
      order: { userId: req.user!.id },
      status: 'DELIVERED',
    },
  });

  const review = await prisma.review.upsert({
    where: { productId_userId: { productId: data.productId, userId: req.user!.id } },
    update: { rating: data.rating, title: data.title, body: data.body },
    create: {
      ...data,
      userId: req.user!.id,
      isVerified: !!purchased,
    },
  });

  res.status(201).json({ success: true, data: { review } });
});

export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  res.json({ success: true, data: { reviews, avgRating, reviewCount: reviews.length } });
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const review = await prisma.review.findFirst({ where: { id, userId: req.user!.id } });
  if (!review) throw new AppError('Review not found', 404);
  await prisma.review.delete({ where: { id } });
  res.json({ success: true, message: 'Review deleted' });
});
