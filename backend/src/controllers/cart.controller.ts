import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProductStatus } from '@prisma/client';

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(20),
});

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await prisma.cart.findUnique({
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
      },
    },
  });

  if (!cart) {
    return res.json({ success: true, data: { items: [], total: 0 } });
  }

  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  res.json({ success: true, data: { cartId: cart.id, items: cart.items, total } });
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, quantity } = addItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { inventory: true },
  });

  if (!product || product.status !== ProductStatus.PUBLISHED) {
    throw new AppError('Product not available', 400);
  }

  const availableStock = (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0);
  if (availableStock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  // Find or create cart
  let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user!.id } });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > availableStock) throw new AppError('Insufficient stock', 400);
    const item = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: newQty },
    });
    return res.json({ success: true, data: { item } });
  }

  const item = await prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity },
  });

  res.status(201).json({ success: true, data: { item } });
});

export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity } = z.object({ quantity: z.number().int().min(1).max(20) }).parse(req.body);

  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
  if (!item) throw new AppError('Cart item not found', 404);

  const updated = await prisma.cartItem.update({ where: { id }, data: { quantity } });
  res.json({ success: true, data: { item: updated } });
});

export const removeCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
  if (!item) throw new AppError('Cart item not found', 404);

  await prisma.cartItem.delete({ where: { id } });
  res.json({ success: true, message: 'Item removed' });
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  res.json({ success: true, message: 'Cart cleared' });
});
