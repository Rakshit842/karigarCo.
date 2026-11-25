"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getWishlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const wishlist = await database_1.prisma.wishlist.findUnique({
        where: { userId: req.user.id },
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
exports.addToWishlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId } = req.body;
    if (!productId)
        throw new AppError_1.AppError('Product ID required', 400);
    const product = await database_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    let wishlist = await database_1.prisma.wishlist.findUnique({ where: { userId: req.user.id } });
    if (!wishlist) {
        wishlist = await database_1.prisma.wishlist.create({ data: { userId: req.user.id } });
    }
    const existing = await database_1.prisma.wishlistItem.findUnique({
        where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
    if (existing) {
        return res.json({ success: true, message: 'Already in wishlist' });
    }
    const item = await database_1.prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId },
    });
    res.status(201).json({ success: true, data: { item } });
});
exports.removeFromWishlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId } = req.params;
    const wishlist = await database_1.prisma.wishlist.findUnique({ where: { userId: req.user.id } });
    if (!wishlist)
        throw new AppError_1.AppError('Wishlist not found', 404);
    await database_1.prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId },
    });
    res.json({ success: true, message: 'Removed from wishlist' });
});
//# sourceMappingURL=wishlist.controller.js.map