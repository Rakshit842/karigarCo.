"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getProductReviews = exports.createReview = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const reviewSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().max(100).optional(),
    body: zod_1.z.string().max(2000).optional(),
});
exports.createReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = reviewSchema.parse(req.body);
    // Check if user has purchased this product
    const purchased = await database_1.prisma.orderItem.findFirst({
        where: {
            productId: data.productId,
            order: { userId: req.user.id },
            status: 'DELIVERED',
        },
    });
    const review = await database_1.prisma.review.upsert({
        where: { productId_userId: { productId: data.productId, userId: req.user.id } },
        update: { rating: data.rating, title: data.title, body: data.body },
        create: {
            ...data,
            userId: req.user.id,
            isVerified: !!purchased,
        },
    });
    res.status(201).json({ success: true, data: { review } });
});
exports.getProductReviews = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId } = req.params;
    const reviews = await database_1.prisma.review.findMany({
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
exports.deleteReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const review = await database_1.prisma.review.findFirst({ where: { id, userId: req.user.id } });
    if (!review)
        throw new AppError_1.AppError('Review not found', 404);
    await database_1.prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted' });
});
//# sourceMappingURL=review.controller.js.map