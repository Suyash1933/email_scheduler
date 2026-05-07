import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
} from '../controllers/emailController';

const router = Router();

router.post('/schedule', isAuthenticated, scheduleEmails);
router.get('/scheduled', isAuthenticated, getScheduledEmails);
router.get('/sent', isAuthenticated, getSentEmails);
router.get('/:id', isAuthenticated, getEmailById);

export default router;
