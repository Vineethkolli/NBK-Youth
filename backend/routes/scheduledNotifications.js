import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { createScheduledNotification, listScheduledNotifications, updateScheduledNotification,
  deleteScheduledNotification, sendScheduledNow } from '../controllers/scheduledNotificationController.js';

const router = express.Router();

router.post('/', auth, checkRole('Privileged'), createScheduledNotification);
router.get('/', auth, checkRole('Privileged'), listScheduledNotifications);
router.put('/:id', auth, checkRole('Privileged'), updateScheduledNotification);
router.delete('/:id', auth, checkRole('Privileged'), deleteScheduledNotification);
router.post('/:id/send', auth, checkRole('Privileged'), sendScheduledNow);

export default router;
