import Notification from '../models/Notification.js';
import User from '../models/User.js';
import webpush from 'web-push';

export const notificationController = {
  // Get notifications for the current user
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({
        $or: [
          { recipients: req.user._id },
          { isGlobal: true }
        ]
      })
      .populate('sender', 'name')
      .sort({ createdAt: -1 });
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  },

  // Send notification
  sendNotification: async (req, res) => {
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
          const users = await User.find({ role: 'user' });
          recipients = users.map(user => user._id);
          break;
        case 'allDevelopers':
          const developers = await User.find({ role: 'developer' });
          recipients = developers.map(dev => dev._id);
          break;
        case 'allAdmins':
          const admins = await User.find({ role: 'admin' });
          recipients = admins.map(admin => admin._id);
          break;
        case 'allFinanciers':
          const financiers = await User.find({ role: 'financier' });
          recipients = financiers.map(fin => fin._id);
          break;
        default:
          // For 'all', make it a global notification
          break;
      }

      // Create notification in database
      const notification = await Notification.create({
        title,
        body,
        sender: req.user._id,
        recipients,
        isGlobal: target === 'all'
      });

      // Send push notifications
      const subscribedUsers = await User.find({
        _id: { $in: recipients },
        pushSubscription: { $exists: true, $ne: null },
        notificationsEnabled: true
      });

      const payload = JSON.stringify({
        title,
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: {
          url: '/notifier'
        }
      });

      const pushPromises = subscribedUsers.map(user =>
        webpush.sendNotification(user.pushSubscription, payload)
          .catch(error => console.error(`Push notification failed for user ${user._id}:`, error))
      );

      await Promise.allSettled(pushPromises);
      res.json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Notification error:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      if (!notification.read.includes(req.user._id)) {
        notification.read.push(req.user._id);
        await notification.save();
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  }
};