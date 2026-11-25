"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.deleteBanner = exports.upsertBanner = exports.getHomepageBanners = exports.toggleUserStatus = exports.listCustomers = exports.updateCommissionRate = exports.getCommissionSettings = exports.listAllOrders = exports.toggleFeaturedProduct = exports.updateProductApproval = exports.listAllProducts = exports.updateSellerStatus = exports.listSellers = exports.getAdminDashboard = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const helpers_1 = require("../utils/helpers");
const email_1 = require("../utils/email");
const config_1 = require("../config");
// Admin Dashboard Overview
exports.getAdminDashboard = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [totalCustomers, totalSellers, pendingSellerApplications, totalProducts, pendingProductApprovals, totalOrders, payments, commissions,] = await Promise.all([
        database_1.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        database_1.prisma.user.count({ where: { role: 'SELLER' } }),
        database_1.prisma.sellerProfile.count({ where: { status: 'PENDING' } }),
        database_1.prisma.product.count({ where: { status: { not: 'ARCHIVED' } } }),
        database_1.prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
        database_1.prisma.order.count(),
        database_1.prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
        database_1.prisma.commission.aggregate({ _sum: { commissionAmount: true } }),
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
exports.listSellers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const status = req.query.status;
    const search = req.query.search;
    const where = {};
    if (status)
        where.status = status;
    if (search) {
        where.OR = [
            { shopName: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
    }
    const [sellers, total] = await Promise.all([
        database_1.prisma.sellerProfile.findMany({
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
        database_1.prisma.sellerProfile.count({ where }),
    ]);
    res.json({ success: true, data: { sellers, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
exports.updateSellerStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = zod_1.z.object({
        status: zod_1.z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
        rejectionReason: zod_1.z.string().optional(),
    }).parse(req.body);
    const seller = await database_1.prisma.sellerProfile.findUnique({
        where: { id },
        include: { user: true },
    });
    if (!seller)
        throw new AppError_1.AppError('Seller not found', 404);
    const updateData = { status };
    if (status === 'APPROVED')
        updateData.approvedAt = new Date();
    if (status === 'REJECTED')
        updateData.rejectionReason = rejectionReason;
    await database_1.prisma.$transaction([
        database_1.prisma.sellerProfile.update({ where: { id }, data: updateData }),
        ...(status === 'APPROVED'
            ? [database_1.prisma.user.update({ where: { id: seller.userId }, data: { role: 'SELLER' } })]
            : []),
    ]);
    // Send email notification
    if (status === 'APPROVED') {
        await (0, email_1.sendEmail)({
            to: seller.user.email,
            subject: 'Your KarigarCo. seller application has been approved!',
            html: email_1.emailTemplates.sellerApproved(seller.shopName),
        });
    }
    // Audit log
    await database_1.prisma.auditLog.create({
        data: {
            userId: req.user.id,
            action: `SELLER_${status}`,
            entity: 'SellerProfile',
            entityId: id,
            metadata: { rejectionReason },
        },
    });
    res.json({ success: true, message: `Seller ${status.toLowerCase()}` });
});
// Manage Products
exports.listAllProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const status = req.query.status;
    const where = {};
    if (status)
        where.status = status;
    const [products, total] = await Promise.all([
        database_1.prisma.product.findMany({
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
        database_1.prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: { products, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
exports.updateProductApproval = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = zod_1.z.object({
        status: zod_1.z.enum(['PUBLISHED', 'REJECTED']),
        rejectionReason: zod_1.z.string().optional(),
    }).parse(req.body);
    const product = await database_1.prisma.product.findUnique({ where: { id } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    const updateData = { status };
    if (status === 'PUBLISHED')
        updateData.approvedAt = new Date();
    if (status === 'REJECTED')
        updateData.rejectionReason = rejectionReason;
    await database_1.prisma.product.update({ where: { id }, data: updateData });
    await database_1.prisma.auditLog.create({
        data: {
            userId: req.user.id,
            action: `PRODUCT_${status}`,
            entity: 'Product',
            entityId: id,
        },
    });
    res.json({ success: true, message: `Product ${status.toLowerCase()}` });
});
exports.toggleFeaturedProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const product = await database_1.prisma.product.findUnique({ where: { id } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    const updated = await database_1.prisma.product.update({
        where: { id },
        data: { isFeatured: !product.isFeatured },
    });
    res.json({ success: true, data: { product: updated } });
});
// Manage Orders
exports.listAllOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const status = req.query.status;
    const where = {};
    if (status)
        where.status = status;
    const [orders, total] = await Promise.all([
        database_1.prisma.order.findMany({
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
        database_1.prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: { orders, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
// Commission settings
exports.getCommissionSettings = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const sellers = await database_1.prisma.sellerProfile.findMany({
        where: { status: 'APPROVED' },
        select: { id: true, shopName: true, commissionRate: true },
    });
    res.json({
        success: true,
        data: { defaultRate: config_1.config.defaultCommissionRate, sellers },
    });
});
exports.updateCommissionRate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { sellerId, commissionRate } = zod_1.z.object({
        sellerId: zod_1.z.string(),
        commissionRate: zod_1.z.number().min(0).max(100),
    }).parse(req.body);
    await database_1.prisma.sellerProfile.update({
        where: { id: sellerId },
        data: { commissionRate },
    });
    await database_1.prisma.auditLog.create({
        data: {
            userId: req.user.id,
            action: 'UPDATE_COMMISSION_RATE',
            entity: 'SellerProfile',
            entityId: sellerId,
            metadata: { commissionRate },
        },
    });
    res.json({ success: true, message: 'Commission rate updated' });
});
// Customer management
exports.listCustomers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const [users, total] = await Promise.all([
        database_1.prisma.user.findMany({
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
        database_1.prisma.user.count({ where: { role: { in: ['CUSTOMER', 'SELLER'] } } }),
    ]);
    res.json({ success: true, data: { users, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
exports.toggleUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await database_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw new AppError_1.AppError('User not found', 404);
    if (user.role === 'ADMIN')
        throw new AppError_1.AppError('Cannot deactivate admin', 403);
    await database_1.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    res.json({ success: true, message: `User ${user.isActive ? 'deactivated' : 'reactivated'}` });
});
// Homepage content
exports.getHomepageBanners = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const banners = await database_1.prisma.homepageBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: { banners } });
});
exports.upsertBanner = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, ...data } = req.body;
    const banner = id
        ? await database_1.prisma.homepageBanner.update({ where: { id }, data })
        : await database_1.prisma.homepageBanner.create({ data });
    res.json({ success: true, data: { banner } });
});
exports.deleteBanner = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.homepageBanner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Banner deleted' });
});
exports.getAuditLogs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const [logs, total] = await Promise.all([
        database_1.prisma.auditLog.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        database_1.prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: { logs, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
//# sourceMappingURL=admin.controller.js.map