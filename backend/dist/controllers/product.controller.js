"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductImage = exports.addProductImage = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.listProducts = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const helpers_1 = require("../utils/helpers");
const client_1 = require("@prisma/client");
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(20),
    shortDescription: zod_1.z.string().max(300).optional(),
    categoryId: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    comparePrice: zod_1.z.number().positive().optional(),
    sku: zod_1.z.string().optional(),
    materials: zod_1.z.string().optional(),
    dimensions: zod_1.z.string().optional(),
    weight: zod_1.z.number().optional(),
    craftOrigin: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isMadeToOrder: zod_1.z.boolean().optional(),
    processingDays: zod_1.z.number().int().optional(),
    stock: zod_1.z.number().int().min(0).optional(),
});
const updateProductSchema = createProductSchema.partial();
// Public: list published products
exports.listProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req.query);
    const { search, categoryId, minPrice, maxPrice, sellerId, sort, featured } = req.query;
    const where = { status: client_1.ProductStatus.PUBLISHED };
    if (search) {
        where.OR = [
            { name: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
            { tags: { has: String(search) } },
        ];
    }
    if (categoryId)
        where.categoryId = String(categoryId);
    if (sellerId)
        where.sellerId = String(sellerId);
    if (featured === 'true')
        where.isFeatured = true;
    if (minPrice || maxPrice) {
        where.price = {
            ...(minPrice && { gte: parseFloat(String(minPrice)) }),
            ...(maxPrice && { lte: parseFloat(String(maxPrice)) }),
        };
    }
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc')
        orderBy = { price: 'asc' };
    else if (sort === 'price_desc')
        orderBy = { price: 'desc' };
    else if (sort === 'newest')
        orderBy = { createdAt: 'desc' };
    const [products, total] = await Promise.all([
        database_1.prisma.product.findMany({
            where,
            include: {
                images: { where: { isPrimary: true }, take: 1 },
                seller: { select: { shopName: true, slug: true, isVerified: true } },
                category: { select: { name: true, slug: true } },
                inventory: { select: { quantity: true } },
                reviews: { select: { rating: true } },
            },
            orderBy,
            skip,
            take: limit,
        }),
        database_1.prisma.product.count({ where }),
    ]);
    const productsWithRating = products.map((p) => {
        const ratings = p.reviews.map((r) => r.rating);
        return {
            ...p,
            avgRating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
            reviewCount: ratings.length,
            reviews: undefined,
        };
    });
    res.json({ success: true, data: { products: productsWithRating, meta: (0, helpers_1.paginationMeta)(total, page, limit) } });
});
// Public: get single product
exports.getProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const product = await database_1.prisma.product.findUnique({
        where: { slug },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            seller: {
                select: {
                    id: true, shopName: true, slug: true, description: true,
                    artisanStory: true, craftSpecialization: true, isVerified: true,
                    city: true, state: true, logoUrl: true,
                },
            },
            category: true,
            inventory: true,
            reviews: {
                include: {
                    user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            },
        },
    });
    if (!product || product.status !== client_1.ProductStatus.PUBLISHED) {
        throw new AppError_1.AppError('Product not found', 404);
    }
    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
    // Related products
    const related = await database_1.prisma.product.findMany({
        where: {
            categoryId: product.categoryId,
            status: client_1.ProductStatus.PUBLISHED,
            id: { not: product.id },
        },
        include: {
            images: { where: { isPrimary: true }, take: 1 },
            seller: { select: { shopName: true, slug: true } },
            inventory: { select: { quantity: true } },
        },
        take: 6,
    });
    res.json({
        success: true,
        data: { product: { ...product, avgRating, reviewCount: ratings.length }, related },
    });
});
// Seller: create product
exports.createProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const seller = await database_1.prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller || seller.status !== client_1.SellerStatus.APPROVED) {
        throw new AppError_1.AppError('Seller account not approved', 403);
    }
    const data = createProductSchema.parse(req.body);
    let slug = (0, helpers_1.slugify)(data.name);
    // Ensure unique slug
    const existing = await database_1.prisma.product.findUnique({ where: { slug } });
    if (existing)
        slug = `${slug}-${Date.now()}`;
    const product = await database_1.prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
            data: {
                ...data,
                price: data.price,
                comparePrice: data.comparePrice,
                slug,
                sellerId,
                status: client_1.ProductStatus.PENDING_APPROVAL,
            },
        });
        await tx.inventory.create({
            data: { productId: p.id, quantity: data.stock || 0 },
        });
        return p;
    });
    res.status(201).json({ success: true, data: { product } });
});
// Seller: update product
exports.updateProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { id } = req.params;
    const product = await database_1.prisma.product.findFirst({ where: { id, sellerId } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    const data = updateProductSchema.parse(req.body);
    let slug = product.slug;
    if (data.name) {
        slug = (0, helpers_1.slugify)(data.name);
        const conflict = await database_1.prisma.product.findFirst({ where: { slug, id: { not: id } } });
        if (conflict)
            slug = `${slug}-${Date.now()}`;
    }
    const updated = await database_1.prisma.$transaction(async (tx) => {
        const p = await tx.product.update({
            where: { id },
            data: { ...data, slug, status: client_1.ProductStatus.PENDING_APPROVAL },
        });
        if (data.stock !== undefined) {
            await tx.inventory.upsert({
                where: { productId: id },
                update: { quantity: data.stock },
                create: { productId: id, quantity: data.stock },
            });
        }
        return p;
    });
    res.json({ success: true, data: { product: updated } });
});
// Seller: delete product
exports.deleteProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { id } = req.params;
    const product = await database_1.prisma.product.findFirst({ where: { id, sellerId } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    await database_1.prisma.product.update({ where: { id }, data: { status: client_1.ProductStatus.ARCHIVED } });
    res.json({ success: true, message: 'Product archived' });
});
// Add product image
exports.addProductImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { productId } = req.params;
    const product = await database_1.prisma.product.findFirst({ where: { id: productId, sellerId } });
    if (!product)
        throw new AppError_1.AppError('Product not found', 404);
    const { url, publicId, altText, isPrimary } = req.body;
    if (isPrimary) {
        await database_1.prisma.productImage.updateMany({
            where: { productId },
            data: { isPrimary: false },
        });
    }
    const image = await database_1.prisma.productImage.create({
        data: { productId, url, publicId, altText, isPrimary: isPrimary || false },
    });
    res.status(201).json({ success: true, data: { image } });
});
// Delete product image
exports.deleteProductImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId)
        throw new AppError_1.AppError('Seller profile not found', 404);
    const { imageId } = req.params;
    const image = await database_1.prisma.productImage.findFirst({
        where: { id: imageId, product: { sellerId } },
    });
    if (!image)
        throw new AppError_1.AppError('Image not found', 404);
    await database_1.prisma.productImage.delete({ where: { id: imageId } });
    res.json({ success: true, message: 'Image deleted' });
});
//# sourceMappingURL=product.controller.js.map