import notificationService from '../services/notificationService.js';
import User from '../models/User.js';

export const notificationController = {
  getVapidPublicKey: (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  },

  subscribe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.pushSubscription = req.body;
      user.notificationsEnabled = true;
      await user.save();

      res.json({ message: 'Subscribed to notifications' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to subscribe to notifications' });
    }
  },

  unsubscribe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.pushSubscription = null;
      user.notificationsEnabled = false;
      await user.save();

      res.json({ message: 'Unsubscribed from notifications' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsubscribe from notifications' });
    }
  },

  send: async (req, res) => {
    try {
      const { title, body, target, registerId } = req.body;
      
      await notificationService.send(
        title,
        body,
        target,
        req.user.id,
        registerId
      );

      res.json({ message: 'Notification sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send notification' });
    }
  },

  getNotifications: async (req, res) => {
    try {
      const notifications = await notificationService.getUserNotifications(
        req.user.id,
        req.user.role
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  },

  getNotificationStatus: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.json({ enabled: user?.notificationsEnabled || false });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notification status' });
    }
  }
};