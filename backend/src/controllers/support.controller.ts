import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subject, message, priority } = createTicketSchema.parse(req.body);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user!.id,
      sellerId: req.user!.sellerId,
      subject,
      priority: priority || 'MEDIUM',
      messages: { create: { senderId: req.user!.id, message } },
    },
    include: { messages: true },
  });

  res.status(201).json({ success: true, data: { ticket } });
});

export const getMyTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ success: true, data: { tickets } });
});

export const getTicketMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: { ticket } });
});

export const addMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!ticket) throw new AppError('Ticket not found', 404);

  await prisma.supportMessage.create({
    data: { ticketId: ticket.id, senderId: req.user!.id, message },
  });
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: 'IN_PROGRESS' },
  });
  res.json({ success: true, message: 'Message sent' });
});
