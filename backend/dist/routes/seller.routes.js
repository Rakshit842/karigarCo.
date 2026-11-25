"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seller_controller_1 = require("../controllers/seller.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public
router.get('/profile/:slug', seller_controller_1.getSellerBySlug);
// Authenticated
router.post('/apply', auth_middleware_1.authenticate, seller_controller_1.applySeller);
// Seller-only
router.get('/dashboard', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getSellerDashboard);
router.get('/me', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getSellerProfile);
router.patch('/profile', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.updateSellerProfile);
router.get('/products', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getSellerProducts);
router.get('/orders', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getSellerOrders);
router.patch('/orders/items/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.updateOrderItemStatus);
router.get('/earnings', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getSellerEarnings);
router.get('/inventory', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.getInventory);
router.post('/inventory/update', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), seller_controller_1.updateStock);
exports.default = router;
//# sourceMappingURL=seller.routes.js.map