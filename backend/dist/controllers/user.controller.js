"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getNotifications = exports.getWishlist = exports.getOrderDetail = exports.getOrders = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).max(50).optional(),
    lastName: zod_1.z.string().min(2).max(50).optional(),
    phone: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});
const addressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(10),
    line1: zod_1.z.string().min(5),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    pinCode: zod_1.z.string().regex(/^\d{6}$/),
    isDefault: zod_1.z.boolean().optional(),
});
exports.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await database_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, role: true, isEmailVerified: true, createdAt: true,
        },
    });
    if (!user)
        throw new AppError_1.AppError('User not found', 404);
    res.json({ success: true, data: { user } });
});
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await database_1.prisma.user.update({
        where: { id: req.user.id },
        data,
        select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatarUrl: true, role: true,
        },
    });
    res.json({ success: true, data: { user } });
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await database_1.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        throw new AppError_1.AppError('User not found', 404);
    const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!isValid)
        throw new AppError_1.AppError('Current password is incorrect', 400);
    const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
    await database_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password changed successfully' });
});
exports.getAddresses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const addresses = await database_1.prisma.address.findMany({
        where: { userId: req.user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { addresses } });
});
exports.addAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = addressSchema.parse(req.body);
    if (data.isDefault) {
        await database_1.prisma.address.updateMany({
            where: { userId: req.user.id },
            data: { isDefault: false },
        });
    }
    const address = await database_1.prisma.address.create({
        data: { ...data, userId: req.user.id },
    });
    res.status(201).json({ success: true, data: { address } });
});
exports.updateAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = addressSchema.parse(req.body);
    const existing = await database_1.prisma.address.findFirst({
        where: { id, userId: req.user.id },
    });
    if (!existing)
        throw new AppError_1.AppError('Address not found', 404);
    if (data.isDefault) {
        await database_1.prisma.address.updateMany({
            where: { userId: req.user.id, id: { not: id } },
            data: { isDefault: false },
        });
    }
    const address = await database_1.prisma.address.update({ where: { id }, data });
    res.json({ success: true, data: { address } });
});
exports.deleteAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existing = await database_1.prisma.address.findFirst({
        where: { id, userId: req.user.id },
    });
    if (!existing)
        throw new AppError_1.AppError('Address not found', 404);
    await database_1.prisma.address.delete({ where: { id } });
    res.json({ success: true, message: 'Address deleted' });
});
exports.getOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const orders = await database_1.prisma.order.findMany({
        where: { userId: req.user.id },
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
exports.getOrderDetail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const order = await database_1.prisma.order.findFirst({
        where: { id: req.params.id, userId: req.user.id },
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
    if (!order)
        throw new AppError_1.AppError('Order not found', 404);
    res.json({ success: true, data: { order } });
});
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
            },
        },
    });
    res.json({ success: true, data: { items: wishlist?.items || [] } });
});
exports.getNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await database_1.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json({ success: true, data: { notifications } });
});
exports.markNotificationRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await database_1.prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { isRead: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
});
//# sourceMappingURL=user.controller.js.map