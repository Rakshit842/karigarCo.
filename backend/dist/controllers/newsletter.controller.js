"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribe = exports.subscribe = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.subscribe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = zod_1.z.object({ email: zod_1.z.string().email() }).parse(req.body);
    await database_1.prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { isActive: true },
        create: { email },
    });
    res.json({ success: true, message: 'Subscribed to newsletter!' });
});
exports.unsubscribe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = zod_1.z.object({ email: zod_1.z.string().email() }).parse(req.body);
    await database_1.prisma.newsletterSubscriber.updateMany({
        where: { email },
        data: { isActive: false },
    });
    res.json({ success: true, message: 'Unsubscribed' });
});
//# sourceMappingURL=newsletter.controller.js.map