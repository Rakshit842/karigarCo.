"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, rateLimiter_1.uploadLimiter);
router.post('/image', upload_controller_1.upload.single('image'), upload_controller_1.uploadImage);
router.delete('/image', upload_controller_1.deleteImage);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map