"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyPayment = exports.createPaymentOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Lazy Razorpay instantiation (only if credentials available)
const getRazorpay = () => {
    if (!config_1.config.razorpay.keyId || !config_1.config.razorpay.keySecret) {
        throw new AppError_1.AppError('Payment gateway not configured. Please set RAZORPAY credentials.', 503);
    }
    const Razorpay = require('razorpay');
    return new Razorpay({ key_id: config_1.config.razorpay.keyId, key_secret: config_1.config.razorpay.keySecret });
};
// Create Razorpay order
exports.createPaymentOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId)
        throw new AppError_1.AppError('Order ID required', 400);
    const order = await database_1.prisma.order.findFirst({
        where: { id: orderId, userId: req.user.id },
    });
    if (!order)
        throw new AppError_1.AppError('Order not found', 404);
    if (order.status !== 'PENDING')
        throw new AppError_1.AppError('Order already processed', 400);
    const razorpay = getRazorpay();
    const amount = Math.round(Number(order.total) * 100); // Convert to paise
    const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id },
    });
    // Create/update payment record
    await database_1.prisma.payment.upsert({
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
            keyId: config_1.config.razorpay.keyId,
        },
    });
});
// Verify payment after Razorpay callback
exports.verifyPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new AppError_1.AppError('Payment verification data missing', 400);
    }
    // Verify signature
    const expectedSignature = crypto_1.default
        .createHmac('sha256', config_1.config.razorpay.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
    if (expectedSignature !== razorpaySignature) {
        await database_1.prisma.payment.update({
            where: { orderId },
            data: { status: 'FAILED', failureReason: 'Signature mismatch' },
        });
        throw new AppError_1.AppError('Payment verification failed', 400);
    }
    // Update payment and order
    await database_1.prisma.$transaction(async (tx) => {
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
const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature || !config_1.config.razorpay.webhookSecret) {
            return res.status(400).json({ success: false });
        }
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSig = crypto_1.default
            .createHmac('sha256', config_1.config.razorpay.webhookSecret)
            .update(body)
            .digest('hex');
        if (expectedSig !== signature) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        const event = JSON.parse(body);
        logger_1.logger.info(`[Webhook] Razorpay event: ${event.event}`);
        if (event.event === 'payment.captured') {
            const paymentId = event.payload.payment.entity.id;
            const orderId = event.payload.payment.entity.notes?.orderId;
            if (orderId) {
                await database_1.prisma.$transaction([
                    database_1.prisma.payment.update({
                        where: { orderId },
                        data: { status: 'COMPLETED', gatewayPaymentId: paymentId },
                    }),
                    database_1.prisma.order.update({
                        where: { id: orderId },
                        data: { status: 'CONFIRMED' },
                    }),
                ]);
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('[Webhook] Error:', error);
        res.status(500).json({ success: false });
    }
};
exports.handleWebhook = handleWebhook;
//# sourceMappingURL=payment.controller.js.map