import { Router } from 'express';
import {
  getSellerBySlug, applySeller,
  getSellerDashboard, getSellerProducts, getSellerOrders,
  updateOrderItemStatus, getSellerEarnings,
  updateSellerProfile, getInventory, updateStock,
  getSellerProfile,
} from '../controllers/seller.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/profile/:slug', getSellerBySlug);

// Authenticated
router.post('/apply', authenticate, applySeller);

// Seller-only
router.get('/dashboard', authenticate, authorize('SELLER'), getSellerDashboard);
router.get('/me', authenticate, authorize('SELLER'), getSellerProfile);
router.patch('/profile', authenticate, authorize('SELLER'), updateSellerProfile);
router.get('/products', authenticate, authorize('SELLER'), getSellerProducts);
router.get('/orders', authenticate, authorize('SELLER'), getSellerOrders);
router.patch('/orders/items/:id/status', authenticate, authorize('SELLER'), updateOrderItemStatus);
router.get('/earnings', authenticate, authorize('SELLER'), getSellerEarnings);
router.get('/inventory', authenticate, authorize('SELLER'), getInventory);
router.post('/inventory/update', authenticate, authorize('SELLER'), updateStock);

export default router;
