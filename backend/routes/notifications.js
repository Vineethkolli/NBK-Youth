import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Public routes
router.get('/vapidPublicKey', notificationController.getVapidPublicKey);

// Protected routes
router.use(auth);

// Subscription management
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);
router.get('/status', notificationController.getNotificationStatus);

// Notification management
router.get('/', notificationController.getNotifications);
router.post('/send', checkRole(['developer']), notificationController.send);

export default router;