import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const subscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true },
    create: { email },
  });

  res.json({ success: true, message: 'Subscribed to newsletter!' });
});

export const unsubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Unsubscribed' });
});
