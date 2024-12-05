import express from 'express';
import webpush from 'web-push';
import { auth, checkRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:example@yourdomain.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Get public key for subscription
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.pushSubscription = subscription;
    user.notificationsEnabled = true;
    await user.save();

    res.json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to subscribe to notifications' });
  }
});

// Send notification (admin/developer only)
router.post('/send', auth, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const { title, body, target, registerId } = req.body;
    let recipients = [];

    // Determine recipients based on target
    switch (target) {
      case 'registerId':
        const user = await User.findOne({ registerId });
        if (user) recipients = [user._id];
        break;
      case 'allUsers':
        const users = await User.find({ role: 'user', notificationsEnabled: true });
        recipients = users.map(user => user._id);
        break;
      case 'allDevelopers':
        const developers = await User.find({ role: 'developer', notificationsEnabled: true });
        recipients = developers.map(dev => dev._id);
        break;
      case 'allAdmins':
        const admins = await User.find({ role: 'admin', notificationsEnabled: true });
        recipients = admins.map(admin => admin._id);
        break;
      case 'allFinanciers':
        const financiers = await User.find({ role: 'financier', notificationsEnabled: true });
        recipients = financiers.map(fin => fin._id);
        break;
      default: // 'all'
        const allUsers = await User.find({ notificationsEnabled: true });
        recipients = allUsers.map(user => user._id);
    }

    // Create notification in database
    const notification = await Notification.create({
      title,
      body,
      sender: req.user.id,
      recipients,
      isGlobal: target === 'all'
    });

    // Send push notifications
    const subscribedUsers = await User.find({
      _id: { $in: recipients },
      pushSubscription: { $exists: true, $ne: null }
    });

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/notifier'
      }
    });

    const notifications = subscribedUsers.map(user =>
      webpush.sendNotification(user.pushSubscription, payload)
    );

    await Promise.allSettled(notifications);
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});


// Unsubscribe from push notifications
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.pushSubscription = null;
    user.notificationsEnabled = false;
    await user.save();

    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe from notifications' });
  }
});

// Get notification status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ enabled: user?.notificationsEnabled || false });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notification status' });
  }
});

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipients: req.user.id },
        { isGlobal: true }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/:notificationId/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.read.includes(req.user.id)) {
      notification.read.push(req.user.id);
      await notification.save();
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Send notification (admin/developer only)
router.post('/send', auth, checkRole(['admin', 'developer']), async (req, res) => {
  try {
    const { title, body, userId } = req.body;
    let recipients = [];
    let isGlobal = false;

    if (userId) {
      const user = await User.findById(userId);
      if (user) recipients = [user._id];
    } else {
      const users = await User.find({ notificationsEnabled: true });
      recipients = users.map(user => user._id);
      isGlobal = true;
    }

    // Create notification in database
    const notification = await Notification.create({
      title,
      body,
      sender: req.user.id,
      recipients,
      isGlobal
    });

    // Send push notifications to subscribed users
    const users = await User.find({
      _id: { $in: recipients },
      pushSubscription: { $exists: true, $ne: null }
    });

    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png'
    });

    const notifications = users.map(user => 
      webpush.sendNotification(user.pushSubscription, payload)
    );

    await Promise.allSettled(notifications);
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

export default router;