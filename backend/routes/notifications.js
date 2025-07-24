import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendNotification,
  getNotificationHistory,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/publicKey', getPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/notify', auth, sendNotification); 
router.get('/history', auth, getNotificationHistory); 

export default router;