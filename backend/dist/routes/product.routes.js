"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public
router.get('/', auth_middleware_1.optionalAuth, product_controller_1.listProducts);
router.get('/:slug', auth_middleware_1.optionalAuth, product_controller_1.getProduct);
// Seller
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), product_controller_1.createProduct);
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), product_controller_1.updateProduct);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), product_controller_1.deleteProduct);
router.post('/:productId/images', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), product_controller_1.addProductImage);
router.delete('/images/:imageId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('SELLER'), product_controller_1.deleteProductImage);
exports.default = router;
//# sourceMappingURL=product.routes.js.map