import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { sendEmailNow, scheduleEmail, listScheduledEmails, listEmailHistory } from '../controllers/emailSenderController.js';

const router = express.Router();

router.post('/send', auth, checkRole('Privileged'), sendEmailNow);
router.post('/schedule', auth, checkRole('Privileged'), scheduleEmail);
router.get('/scheduled', auth, checkRole('Privileged'), listScheduledEmails);
router.get('/history', auth, checkRole('Privileged'), listEmailHistory);

export default router;
