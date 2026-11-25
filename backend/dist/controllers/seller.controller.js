"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerProfile = exports.updateStock = exports.getInventory = exports.updateSellerProfile = exports.getSellerEarnings = exports.updateOrderItemStatus = exports.getSellerOrders = exports.getSellerProducts = exports.getSellerDashboard = exports.applySeller = exports.getSellerBySlug = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const helpers_1 = require("../utils/helpers");
const client_1 = require("@prisma/client");
const applySellerSchema = zod_1.z.object({
    shopName: zod_1.z.string().min(3).max(100),
    description: zod_1.z.string().min(20).max(2000),
    artisanStory: zod_1.z.string().optional(),
    craftSpecialization: zod_1.z.string().min(3),
    phone: zod_1.z.string().min(10),
    businessAddress: zod_1.z.string().min(10),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    pinCode: zod_1.z.string().regex(/^\d{6}$/),
});
const updateProfileSchema = zod_1.z.object({
    shopName: zod_1.z.string().min(3).max(100).optional(),
    description: zod_1.z.string().optional(),
    artisanStory: zod_1.z.string().optional(),
    craftSpecialization: zod_1.z.string().optional(),
    logoUrl: zod_1.z.string().url().optional(),
    coverImageUrl: zod_1.z.string().url().optional(),
    phone: zod_1.z.string().optional(),
    businessAddress: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pinCode: zod_1.z.string().optional(),
    socialLinks: zod_1.z.record(zod_1.z.string()).optional(),
    bankAccountName: zod_1.z.string().optional(),
    bankAccountNumber: zod_1.z.string().optional(),
    bankIFSC: zod_1.z.string().optional(),
    upiId: zod_1.z.string().optional(),
});
// Public: Get seller by slug
exports.getSellerBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const seller = await database_1.prisma.sellerProfile.findUnique({
        where: { slug },
        include: {
            user: { select: { createdAt: true } },
            products: {
                where: { status: client_1.ProductStatus.PUBLISHED },
                include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    inventory: { select: { quantity: true } },
                    reviews: { select: { rating: true } },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!seller || seller.status !== client_1.SellerStatus.APPROVED) {
        throw new AppError_1.AppError('Seller not found', 404);
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
exports.applySeller = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== 'CUSTOMER' && req.user.role !== 'SELLER') {
        throw new AppError_1.AppError('Invalid account type', 400);
    }
    const existing = await database_1.prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (existing)
        throw new AppError_1.AppError('You already have a seller profile', 409);
    const data = applySellerSchema.parse(req.body);
    const slug = (0, helpers_1.slugify)(data.shopName);
    const slugConflict = await database_1.prisma.sellerProfile.findUnique({ where: { slug } });
    if (slugConflict)
        throw new AppError_1.AppError('Shop name is already taken', 409);
    const seller = await database_1.prisma.sellerProfile.create({
        data: {
            ...data,
            slug,
            userId: req.user.id,
        },
    });
    res.status(201).json({
        success: true,
        message: 'Seller application submitted. We will review it shortly.',
        data: { seller },
    });
});
// Get own seller dashboard overview
exports.getSellerDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const seller = await database_1.prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller || seller.status !== client_1.SellerStatus.APPROVED) {
        throw new AppError_1.AppError('Seller account not approved', 403);
    }
    const [totalProducts, pendingOrders, completedOrders, lowStockProducts, commissions, recentOrders,] = await Promise.all([
        database_1.prisma.product.count({ where: { sellerId } }),
        database_1.prisma.orderItem.count({ where: { sellerId, status: 'PENDING' } }),
        database_1.prisma.orderItem.count({ where: { sellerId, status: 'DELIVERED' } }),
        database_1.prisma.inventory.count({ where: { product: { sellerId }, quantity: { lte: 5, gt: 0 } } }),
        database_1.prisma.commission.findMany({
            where: { sellerId },
            select: { grossAmount: true, commissionAmount: true, netAmount: true },
        }),
        database_1.prisma.orderItem.findMany({
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
exports.getSellerProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const status = req.query.status;
    const where = { sellerId, ...(status && { status }) };
    const [products, total] = await Promise.all([
        database_1.prisma.product.findMany({
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
        database_1.prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: { products, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
// Get seller's orders
exports.getSellerOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const status = req.query.status;
    const where = { sellerId, ...(status && { status: status }) };
    const [items, total] = await Promise.all([
        database_1.prisma.orderItem.findMany({
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
        database_1.prisma.orderItem.count({ where }),
    ]);
    res.json({ success: true, data: { orders: items, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
// Update seller order item (ship / deliver)
exports.updateOrderItemStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { id } = req.params;
    const { status, trackingNumber, trackingUrl } = req.body;
    const item = await database_1.prisma.orderItem.findFirst({ where: { id, sellerId } });
    if (!item)
        throw new AppError_1.AppError('Order item not found', 404);
    const allowedTransitions = {
        PENDING: ['PROCESSING'],
        PROCESSING: ['SHIPPED'],
        SHIPPED: ['DELIVERED'],
    };
    if (!allowedTransitions[item.status]?.includes(status)) {
        throw new AppError_1.AppError(`Cannot transition from ${item.status} to ${status}`, 400);
    }
    const updateData = { status };
    if (status === 'SHIPPED') {
        updateData.shippedAt = new Date();
        if (trackingNumber)
            updateData.trackingNumber = trackingNumber;
        if (trackingUrl)
            updateData.trackingUrl = trackingUrl;
    }
    if (status === 'DELIVERED')
        updateData.deliveredAt = new Date();
    const updated = await database_1.prisma.orderItem.update({ where: { id }, data: updateData });
    res.json({ success: true, data: { orderItem: updated } });
});
// Get seller earnings
exports.getSellerEarnings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const commissions = await database_1.prisma.commission.findMany({
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
    const settlements = await database_1.prisma.sellerSettlement.findMany({
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
exports.updateSellerProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const data = updateProfileSchema.parse(req.body);
    if (data.shopName) {
        const slug = (0, helpers_1.slugify)(data.shopName);
        const conflict = await database_1.prisma.sellerProfile.findFirst({
            where: { slug, id: { not: sellerId } },
        });
        if (conflict)
            throw new AppError_1.AppError('Shop name already taken', 409);
        data.slug = slug;
    }
    const seller = await database_1.prisma.sellerProfile.update({
        where: { id: sellerId },
        data,
    });
    res.json({ success: true, data: { seller } });
});
// Get inventory overview
exports.getInventory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const inventory = await database_1.prisma.inventory.findMany({
        where: { product: { sellerId } },
        include: {
            product: { select: { id: true, name: true, slug: true, status: true } },
        },
        orderBy: { quantity: 'asc' },
    });
    res.json({ success: true, data: { inventory } });
});
// Update stock
exports.updateStock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { productId, quantity } = zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().int().min(0),
    }).parse(req.body);
    const product = await database_1.prisma.product.findFirst({ where: { id: productId, sellerId } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    const inventory = await database_1.prisma.inventory.upsert({
        where: { productId },
        update: { quantity },
        create: { productId, quantity },
    });
    res.json({ success: true, data: { inventory } });
});
// Get seller profile (own)
exports.getSellerProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const seller = await database_1.prisma.sellerProfile.findUnique({
        where: { id: sellerId },
        include: {
            user: { select: { email: true, firstName: true, lastName: true } },
            verificationDocs: true,
        },
    });
    res.json({ success: true, data: { seller } });
});
//# sourceMappingURL=seller.controller.js.map