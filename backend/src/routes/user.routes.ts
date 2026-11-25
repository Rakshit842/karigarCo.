import { Router } from 'express';
import {
  getProfile, updateProfile, changePassword,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getOrders, getOrderDetail, getWishlist,
  getNotifications, markNotificationRead,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.get('/wishlist', getWishlist);

router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
