import webpush from 'web-push';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

class NotificationService {
  constructor() {
    webpush.setVapidDetails(
      'mailto:example@yourdomain.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async getTargetUsers(target, registerId = null) {
    let query = { notificationsEnabled: true };

    switch (target) {
      case 'registerId':
        query.registerId = registerId;
        break;
      case 'allUsers':
        query.role = 'user';
        break;
      case 'allDevelopers':
        query.role = 'developer';
        break;
      case 'allAdmins':
        query.role = 'admin';
        break;
      case 'allFinanciers':
        query.role = 'financier';
        break;
      case 'allYouth':
        query.category = 'youth';
        break;
    }

    return User.find(query).select('pushSubscription');
  }

  async sendPushNotification(subscription, payload) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  async send(title, body, target, senderId, registerId = null) {
    const users = await this.getTargetUsers(target, registerId);
    const notification = await Notification.create({
      title,
      body,
      sender: senderId,
      target
    });

    const payload = {
      title,
      body,
      notificationId: notification._id
    };

    const sendPromises = users
      .filter(user => user.pushSubscription)
      .map(user => this.sendPushNotification(user.pushSubscription, payload));

    await Promise.allSettled(sendPromises);
    return notification;
  }

  async getUserNotifications(userId, userRole) {
    const query = {
      $or: [
        { target: 'all' },
        { target: `all${userRole.charAt(0).toUpperCase() + userRole.slice(1)}s` }
      ]
    };

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'name');
  }
}

export default new NotificationService();