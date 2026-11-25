import { Router } from 'express';
import {
  getAdminDashboard, listSellers, updateSellerStatus,
  listAllProducts, updateProductApproval, toggleFeaturedProduct,
  listAllOrders, getCommissionSettings, updateCommissionRate,
  listCustomers, toggleUserStatus,
  getHomepageBanners, upsertBanner, deleteBanner, getAuditLogs,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getAdminDashboard);

// Sellers
router.get('/sellers', listSellers);
router.patch('/sellers/:id/status', updateSellerStatus);

// Products
router.get('/products', listAllProducts);
router.patch('/products/:id/approval', updateProductApproval);
router.patch('/products/:id/featured', toggleFeaturedProduct);

// Orders
router.get('/orders', listAllOrders);

// Commission
router.get('/commissions', getCommissionSettings);
router.patch('/commissions', updateCommissionRate);

// Customers
router.get('/customers', listCustomers);
router.patch('/customers/:id/toggle-status', toggleUserStatus);

// Content
router.get('/banners', getHomepageBanners);
router.post('/banners', upsertBanner);
router.delete('/banners/:id', deleteBanner);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
