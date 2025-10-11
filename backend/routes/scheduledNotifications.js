import express from 'express';
import { auth } from '../middleware/auth.js';
import { createScheduledNotification, listScheduledNotifications, updateScheduledNotification,
  deleteScheduledNotification, sendScheduledNow } from '../controllers/scheduledNotificationController.js';

const router = express.Router();

router.post('/', auth, createScheduledNotification);
router.get('/', auth, listScheduledNotifications);
router.put('/:id', auth, updateScheduledNotification);
router.delete('/:id', auth, deleteScheduledNotification);
router.post('/:id/send', auth, sendScheduledNow);

export default router;
