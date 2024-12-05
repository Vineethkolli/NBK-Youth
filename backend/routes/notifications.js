import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Get notifications
router.get('/', auth, notificationController.getNotifications);

// Send notification (admin/developer only)
router.post('/send', auth, checkRole(['admin', 'developer']), notificationController.sendNotification);

// Mark notification as read
router.patch('/:id/read', auth, notificationController.markAsRead);

export default router;