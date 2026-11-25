"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authLimiter, auth_controller_1.register);
router.post('/login', rateLimiter_1.authLimiter, auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
router.get('/verify-email', auth_controller_1.verifyEmail);
router.post('/forgot-password', rateLimiter_1.authLimiter, auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map