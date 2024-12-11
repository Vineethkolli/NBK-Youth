import express from 'express';
import webpush from 'web-push';
import { auth, checkRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get public VAPID key for subscription
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pushSubscription = subscription;
    user.notificationsEnabled = true;
    await user.save();

    res.json({ message: 'Subscription successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Subscription failed' });
  }
});

// Send notifications to users
router.post('/send', auth, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const { title, body, target } = req.body;
    let recipients = [];

    // Determine recipients
    if (target === 'all') {
      recipients = await User.find({ notificationsEnabled: true }).select('_id pushSubscription');
    } else {
      const user = await User.findOne({ registerId: target, notificationsEnabled: true }).select('_id pushSubscription');
      if (user) recipients.push(user);
    }

    // Create notification
    const notification = await Notification.create({
      title,
      body,
      sender: req.user.id,
      recipients: recipients.map(user => user._id),
      isGlobal: target === 'all',
    });

    // Send push notifications
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon.png',
      data: { url: '/notifications' }
    });

    const sendNotifications = recipients.map(user =>
      webpush.sendNotification(user.pushSubscription, payload).catch(err => console.error('Webpush error:', err))
    );

    await Promise.all(sendNotifications);
    res.json({ message: 'Notifications sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Notification send failed' });
  }
});

// Unsubscribe from notifications
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pushSubscription = null;
    user.notificationsEnabled = false;
    await user.save();

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unsubscription failed' });
  }
});

export default router;
