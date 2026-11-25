"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("../controllers/support.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/tickets', support_controller_1.createTicket);
router.get('/tickets', support_controller_1.getMyTickets);
router.get('/tickets/:id', support_controller_1.getTicketMessages);
router.post('/tickets/:id/messages', support_controller_1.addMessage);
exports.default = router;
//# sourceMappingURL=support.routes.js.map