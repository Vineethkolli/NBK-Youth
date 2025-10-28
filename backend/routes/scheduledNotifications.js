import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { createScheduledNotification, listScheduledNotifications, updateScheduledNotification,
  deleteScheduledNotification, sendScheduledNow } from '../controllers/scheduledNotificationController.js';

const router = express.Router();

router.post('/', auth, checkRole(['developer', 'financier', 'admin']), createScheduledNotification);
router.get('/', auth, checkRole(['developer', 'financier', 'admin']), listScheduledNotifications);
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']), updateScheduledNotification);
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), deleteScheduledNotification);
router.post('/:id/send', auth, checkRole(['developer', 'financier', 'admin']), sendScheduledNow);

export default router;
