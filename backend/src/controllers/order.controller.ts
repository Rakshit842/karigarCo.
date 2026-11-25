import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateOrderNumber } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../utils/email';
import { config } from '../config';

const createOrderSchema = z.object({
  addressId: z.string(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { addressId, couponCode, notes } = createOrderSchema.parse(req.body);
  const userId = req.user!.id;

  // Validate address belongs to user
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new AppError('Address not found', 404);

  // Get cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { inventory: true, seller: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  // Validate all items
  for (const item of cart.items) {
    if (item.product.status !== 'PUBLISHED') {
      throw new AppError(`Product "${item.product.name}" is not available`, 400);
    }
    const available = (item.product.inventory?.quantity || 0) - (item.product.inventory?.reservedQuantity || 0);
    if (available < item.quantity) {
      throw new AppError(`Insufficient stock for "${item.product.name}"`, 400);
    }
  }

  // Coupon validation
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) throw new AppError('Invalid coupon', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('Coupon expired', 400);
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);
  }

  const subtotal = cart.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shippingCharge = subtotal >= 999 ? 0 : 99; // Free shipping above ₹999

  if (coupon) {
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new AppError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
    }
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Number(coupon.discountValue);
    }
  }

  const total = Math.max(0, subtotal + shippingCharge - discount);
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const o = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        shippingCharge,
        discount,
        total,
        couponCode: couponCode || null,
        notes,
      },
    });

    // Create order items + reduce stock + create commissions
    for (const item of cart.items) {
      const seller = item.product.seller;
      const unitPrice = Number(item.product.price);
      const totalPrice = unitPrice * item.quantity;
      const commissionRate = seller.commissionRate || config.defaultCommissionRate;
      const commissionAmount = (totalPrice * commissionRate) / 100;
      const netAmount = totalPrice - commissionAmount;

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: o.id,
          productId: item.productId,
          sellerId: item.product.sellerId,
          productName: item.product.name,
          productImageUrl: null,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
      });

      await tx.commission.create({
        data: {
          orderItemId: orderItem.id,
          sellerId: item.product.sellerId,
          grossAmount: totalPrice,
          commissionRate,
          commissionAmount,
          netAmount,
        },
      });

      // Reserve stock
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });
    }

    // Increment coupon usage
    if (couponCode) {
      await tx.coupon.update({ where: { code: couponCode }, data: { usageCount: { increment: 1 } } });
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return o;
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await sendEmail({
      to: user.email,
      subject: `Order Confirmed — #${orderNumber}`,
      html: emailTemplates.orderConfirmation(user.firstName, orderNumber, total),
    });
  }

  res.status(201).json({ success: true, data: { order } });
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: { include: { seller: { select: { shopName: true } } } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { orders } });
});

export const getOrderDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          seller: { select: { shopName: true, slug: true } },
        },
      },
      payment: true,
      address: true,
    },
  });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, data: { order } });
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    await tx.orderItem.updateMany({
      where: { orderId: order.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    // Release reserved stock
    for (const item of order.items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { reservedQuantity: { decrement: item.quantity } },
      });
    }
  });

  res.json({ success: true, message: 'Order cancelled' });
});
