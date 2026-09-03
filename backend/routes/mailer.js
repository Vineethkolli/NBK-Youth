import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
	sendEmailNow,
	scheduleEmail,
	listScheduledEmails,
	listEmailHistory,
	updateScheduledEmail,
	rescheduleEmail,
	deleteScheduledEmail
} from '../controllers/mailerController.js';

const router = express.Router();

router.post('/send', auth, checkRole('Privileged'), sendEmailNow);
router.post('/schedule', auth, checkRole('Privileged'), scheduleEmail);
router.get('/scheduled', auth, checkRole('Privileged'), listScheduledEmails);
router.get('/history', auth, checkRole('Privileged'), listEmailHistory);
router.put('/scheduled/:id', auth, checkRole('Privileged'), updateScheduledEmail);
router.post('/scheduled/:id/reschedule', auth, checkRole('Privileged'), rescheduleEmail);
router.delete('/scheduled/:id', auth, checkRole('Privileged'), deleteScheduledEmail);

export default router;
