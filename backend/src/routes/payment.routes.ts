import { Router } from 'express';
import { createPaymentOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Webhook must be before authenticate (uses raw body)
router.post('/webhook', handleWebhook);

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);

export default router;
