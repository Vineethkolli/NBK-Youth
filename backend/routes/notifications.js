import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendNotification,
  getNotificationHistory,
  createScheduledNotification,
  listScheduledNotifications,
  updateScheduledNotification,
  rescheduleNotification,
  deleteScheduledNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/publicKey', getPublicKey);
router.post('/subscribe', auth, subscribe);
router.post('/unsubscribe', auth, unsubscribe);
router.post('/notify', auth, sendNotification); 
router.get('/history', auth, getNotificationHistory); 
router.post('/scheduled', auth, checkRole('Privileged'), createScheduledNotification);
router.get('/scheduled', auth, checkRole('Privileged'), listScheduledNotifications);
router.put('/scheduled/:id', auth, checkRole('Privileged'), updateScheduledNotification);
router.post('/scheduled/:id/reschedule', auth, checkRole('Privileged'), rescheduleNotification);
router.delete('/scheduled/:id', auth, checkRole('Privileged'), deleteScheduledNotification);

export default router;