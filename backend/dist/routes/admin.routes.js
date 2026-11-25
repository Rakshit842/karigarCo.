"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'));
router.get('/dashboard', admin_controller_1.getAdminDashboard);
// Sellers
router.get('/sellers', admin_controller_1.listSellers);
router.patch('/sellers/:id/status', admin_controller_1.updateSellerStatus);
// Products
router.get('/products', admin_controller_1.listAllProducts);
router.patch('/products/:id/approval', admin_controller_1.updateProductApproval);
router.patch('/products/:id/featured', admin_controller_1.toggleFeaturedProduct);
// Orders
router.get('/orders', admin_controller_1.listAllOrders);
// Commission
router.get('/commissions', admin_controller_1.getCommissionSettings);
router.patch('/commissions', admin_controller_1.updateCommissionRate);
// Customers
router.get('/customers', admin_controller_1.listCustomers);
router.patch('/customers/:id/toggle-status', admin_controller_1.toggleUserStatus);
// Content
router.get('/banners', admin_controller_1.getHomepageBanners);
router.post('/banners', admin_controller_1.upsertBanner);
router.delete('/banners/:id', admin_controller_1.deleteBanner);
// Audit logs
router.get('/audit-logs', admin_controller_1.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map