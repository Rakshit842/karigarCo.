"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeCartItem = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const client_1 = require("@prisma/client");
const addItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    quantity: zod_1.z.number().int().min(1).max(20),
});
exports.getCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cart = await database_1.prisma.cart.findUnique({
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
            },
        },
    });
    if (!cart) {
        return res.json({ success: true, data: { items: [], total: 0 } });
    }
    const total = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    res.json({ success: true, data: { cartId: cart.id, items: cart.items, total } });
});
exports.addToCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { productId, quantity } = addItemSchema.parse(req.body);
    const product = await database_1.prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true },
    });
    if (!product || product.status !== client_1.ProductStatus.PUBLISHED) {
        throw new AppError_1.AppError('Product not available', 400);
    }
    const availableStock = (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0);
    if (availableStock < quantity) {
        throw new AppError_1.AppError('Insufficient stock', 400);
    }
    // Find or create cart
    let cart = await database_1.prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
        cart = await database_1.prisma.cart.create({ data: { userId: req.user.id } });
    }
    const existing = await database_1.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > availableStock)
            throw new AppError_1.AppError('Insufficient stock', 400);
        const item = await database_1.prisma.cartItem.update({
            where: { cartId_productId: { cartId: cart.id, productId } },
            data: { quantity: newQty },
        });
        return res.json({ success: true, data: { item } });
    }
    const item = await database_1.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
    });
    res.status(201).json({ success: true, data: { item } });
});
exports.updateCartItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { quantity } = zod_1.z.object({ quantity: zod_1.z.number().int().min(1).max(20) }).parse(req.body);
    const cart = await database_1.prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart)
        throw new AppError_1.AppError('Cart not found', 404);
    const item = await database_1.prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
    if (!item)
        throw new AppError_1.AppError('Cart item not found', 404);
    const updated = await database_1.prisma.cartItem.update({ where: { id }, data: { quantity } });
    res.json({ success: true, data: { item: updated } });
});
exports.removeCartItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const cart = await database_1.prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart)
        throw new AppError_1.AppError('Cart not found', 404);
    const item = await database_1.prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
    if (!item)
        throw new AppError_1.AppError('Cart item not found', 404);
    await database_1.prisma.cartItem.delete({ where: { id } });
    res.json({ success: true, message: 'Item removed' });
});
exports.clearCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cart = await database_1.prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
        await database_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true, message: 'Cart cleared' });
});
//# sourceMappingURL=cart.controller.js.map