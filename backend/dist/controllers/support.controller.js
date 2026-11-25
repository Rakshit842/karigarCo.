"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessage = exports.getTicketMessages = exports.getMyTickets = exports.createTicket = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const createTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(5).max(200),
    message: zod_1.z.string().min(10),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});
exports.createTicket = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { subject, message, priority } = createTicketSchema.parse(req.body);
    const ticket = await database_1.prisma.supportTicket.create({
        data: {
            userId: req.user.id,
            sellerId: req.user.sellerId,
            subject,
            priority: priority || 'MEDIUM',
            messages: { create: { senderId: req.user.id, message } },
        },
        include: { messages: true },
    });
    res.status(201).json({ success: true, data: { ticket } });
});
exports.getMyTickets = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const tickets = await database_1.prisma.supportTicket.findMany({
        where: { userId: req.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: { tickets } });
});
exports.getTicketMessages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ticket = await database_1.prisma.supportTicket.findFirst({
        where: { id: req.params.id, userId: req.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket)
        throw new AppError_1.AppError('Ticket not found', 404);
    res.json({ success: true, data: { ticket } });
});
exports.addMessage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { message } = zod_1.z.object({ message: zod_1.z.string().min(1) }).parse(req.body);
    const ticket = await database_1.prisma.supportTicket.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });
    if (!ticket)
        throw new AppError_1.AppError('Ticket not found', 404);
    await database_1.prisma.supportMessage.create({
        data: { ticketId: ticket.id, senderId: req.user.id, message },
    });
    await database_1.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'IN_PROGRESS' },
    });
    res.json({ success: true, message: 'Message sent' });
});
//# sourceMappingURL=support.controller.js.map