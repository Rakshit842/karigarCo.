import { Router } from 'express';
import { createTicket, getMyTickets, getTicketMessages, addMessage } from '../controllers/support.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/tickets', createTicket);
router.get('/tickets', getMyTickets);
router.get('/tickets/:id', getTicketMessages);
router.post('/tickets/:id/messages', addMessage);

export default router;
