import { Router } from 'express';
import { createOrder, getOrders, getOrderDetail, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderDetail);
router.post('/:id/cancel', cancelOrder);

export default router;
