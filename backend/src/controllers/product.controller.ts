import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { slugify, getPaginationParams, paginationMeta } from '../utils/helpers';
import { ProductStatus, SellerStatus } from '@prisma/client';

const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(20),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  sku: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.number().optional(),
  craftOrigin: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isMadeToOrder: z.boolean().optional(),
  processingDays: z.number().int().optional(),
  stock: z.number().int().min(0).optional(),
});

const updateProductSchema = createProductSchema.partial();

// Public: list published products
export const listProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, categoryId, minPrice, maxPrice, sellerId, sort, featured } = req.query;

  const where: any = { status: ProductStatus.PUBLISHED };
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { tags: { has: String(search) } },
    ];
  }
  if (categoryId) where.categoryId = String(categoryId);
  if (sellerId) where.sellerId = String(sellerId);
  if (featured === 'true') where.isFeatured = true;
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && { gte: parseFloat(String(minPrice)) }),
      ...(maxPrice && { lte: parseFloat(String(maxPrice)) }),
    };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  else if (sort === 'price_desc') orderBy = { price: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
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
    prisma.product.count({ where }),
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

  res.json({ success: true, data: { products: productsWithRating, meta: paginationMeta(total, page, limit) } });
});

// Public: get single product
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const product = await prisma.product.findUnique({
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

  if (!product || product.status !== ProductStatus.PUBLISHED) {
    throw new AppError('Product not found', 404);
  }

  const ratings = product.reviews.map((r) => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  // Related products
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: ProductStatus.PUBLISHED,
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
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller || seller.status !== SellerStatus.APPROVED) {
    throw new AppError('Seller account not approved', 403);
  }

  const data = createProductSchema.parse(req.body);
  let slug = slugify(data.name);

  // Ensure unique slug
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        ...data,
        price: data.price,
        comparePrice: data.comparePrice,
        slug,
        sellerId,
        status: ProductStatus.PENDING_APPROVAL,
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
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { id } = req.params;
  const product = await prisma.product.findFirst({ where: { id, sellerId } });
  if (!product) throw new AppError('Product not found', 404);

  const data = updateProductSchema.parse(req.body);
  let slug = product.slug;
  if (data.name) {
    slug = slugify(data.name);
    const conflict = await prisma.product.findFirst({ where: { slug, id: { not: id } } });
    if (conflict) slug = `${slug}-${Date.now()}`;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id },
      data: { ...data, slug, status: ProductStatus.PENDING_APPROVAL },
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
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { id } = req.params;
  const product = await prisma.product.findFirst({ where: { id, sellerId } });
  if (!product) throw new AppError('Product not found', 404);

  await prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
  res.json({ success: true, message: 'Product archived' });
});

// Add product image
export const addProductImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { productId } = req.params;
  const product = await prisma.product.findFirst({ where: { id: productId, sellerId } });
  if (!product) throw new AppError('Product not found', 404);

  const { url, publicId, altText, isPrimary } = req.body;

  if (isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.productImage.create({
    data: { productId, url, publicId, altText, isPrimary: isPrimary || false },
  });

  res.status(201).json({ success: true, data: { image } });
});

// Delete product image
export const deleteProductImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.sellerId;
  if (!sellerId) throw new AppError('Seller profile not found', 404);

  const { imageId } = req.params;
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, product: { sellerId } },
  });
  if (!image) throw new AppError('Image not found', 404);

  await prisma.productImage.delete({ where: { id: imageId } });
  res.json({ success: true, message: 'Image deleted' });
});
