"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', cart_controller_1.getCart);
router.post('/items', cart_controller_1.addToCart);
router.patch('/items/:id', cart_controller_1.updateCartItem);
router.delete('/items/:id', cart_controller_1.removeCartItem);
router.delete('/', cart_controller_1.clearCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map