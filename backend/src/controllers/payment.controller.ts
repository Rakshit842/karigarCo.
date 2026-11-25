import { Response, Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config';
import { logger } from '../utils/logger';

// Lazy Razorpay instantiation (only if credentials available)
const getRazorpay = () => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new AppError('Payment gateway not configured. Please set RAZORPAY credentials.', 503);
  }
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
};

// Create Razorpay order
export const createPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) throw new AppError('Order ID required', 400);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.id },
  });
  if (!order) throw new AppError('Order not found', 404);

  if (order.status !== 'PENDING') throw new AppError('Order already processed', 400);

  const razorpay = getRazorpay();
  const amount = Math.round(Number(order.total) * 100); // Convert to paise

  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });

  // Create/update payment record
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      amount: order.total,
      gatewayOrderId: razorpayOrder.id,
    },
    update: { gatewayOrderId: razorpayOrder.id },
  });

  res.json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      keyId: config.razorpay.keyId,
    },
  });
});

// Verify payment after Razorpay callback
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Payment verification data missing', 400);
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    await prisma.payment.update({
      where: { orderId },
      data: { status: 'FAILED', failureReason: 'Signature mismatch' },
    });
    throw new AppError('Payment verification failed', 400);
  }

  // Update payment and order
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    // Convert reserved stock to actual reduction
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      });
    }
  });

  res.json({ success: true, message: 'Payment verified successfully' });
});

// Razorpay Webhook (raw body)
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature || !config.razorpay.webhookSecret) {
      return res.status(400).json({ success: false });
    }

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSig = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    logger.info(`[Webhook] Razorpay event: ${event.event}`);

    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.notes?.orderId;
      if (orderId) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { orderId },
            data: { status: 'COMPLETED', gatewayPaymentId: paymentId },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
          }),
        ]);
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[Webhook] Error:', error);
    res.status(500).json({ success: false });
  }
};
