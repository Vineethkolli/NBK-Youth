import webpush from 'web-push';
import Subscription from '../models/Notification.js'; 
import User from '../models/User.js';
import NotificationHistory from '../models/NotificationHistory.js';
import { logActivity } from '../middleware/activityLogger.js';

export const getPublicKey = (req, res) => {
  res.json({ publicKey: process.env.PUBLIC_VAPID_KEY });
};

export const subscribe = async (req, res) => {
  const { registerId, subscription } = req.body;

  if (!registerId || !subscription) {
    return res.status(400).json({ error: "registerId and subscription are required" });
  }

  try {
    const existingUser = await Subscription.findOne({ registerId });

    if (existingUser) {
      // Avoid duplicate subscriptions
      const isAlreadySubscribed = existingUser.subscriptions.some(
        (sub) => sub.endpoint === subscription.endpoint
      );
      if (!isAlreadySubscribed) {
        existingUser.subscriptions.push(subscription);
        await existingUser.save();
      }
    } else {
      await Subscription.create({ registerId, subscriptions: [subscription] });
    }

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};

export const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    // Remove only the matching subscription from the subscriptions array
    await Subscription.updateOne(
      { "subscriptions.endpoint": endpoint },
      { $pull: { subscriptions: { endpoint } } }
    );
    console.log('Unsubscribed:', endpoint);
    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

export const sendNotification = async (req, res) => {
  const { title, body, target, registerId } = req.body;
  const senderRegisterId = req.user.registerId; 
  const payload = JSON.stringify({ title, body });

  try {
    let eligibleRegisterIds = [];
    let subscriptionUsers = [];

    // Determine eligible users based on target criteria using the User collection
    if (target === 'All') {
      const allUsers = await User.find({}, 'registerId');
      eligibleRegisterIds = allUsers.map((user) => user.registerId);
      subscriptionUsers = await Subscription.find({ registerId: { $in: eligibleRegisterIds } });
    } else if (target === 'Admins_Financiers_Developers') {
      eligibleRegisterIds = await getRoleBasedRegisterIds(['admin', 'financier', 'developer']);
      subscriptionUsers = await Subscription.find({ registerId: { $in: eligibleRegisterIds } });
    } else if (target === 'Specific User' && registerId) {
      eligibleRegisterIds = [registerId];
      subscriptionUsers = await Subscription.find({ registerId });
    } else if (target === 'Youth_Category') {
      eligibleRegisterIds = await getCategoryBasedRegisterIds('youth');
      subscriptionUsers = await Subscription.find({ registerId: { $in: eligibleRegisterIds } });
    } else {
      return res.status(400).json({ error: 'Invalid target selection' });
    }

    if (eligibleRegisterIds.length === 0) {
      return res.status(404).json({ error: 'No eligible users found for the selected target' });
    }

    const notifications = subscriptionUsers.flatMap((user) =>
      user.subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (error) {
          // If subscription is expired or invalid, remove it from the user's subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.subscriptions = user.subscriptions.filter((s) => s.endpoint !== sub.endpoint);
            await user.save();
            console.log('Deleted expired subscription:', sub.endpoint);
          } else {
            console.error('Error sending notification:', error);
          }
        }
      })
    );

    await Promise.all(notifications);

    // Create notification history with sender information
    await NotificationHistory.create({
      title,
      body,
      recipients: eligibleRegisterIds,
      sentBy: senderRegisterId,
    });

    await logActivity(
      req,
      'CREATE',
      'Notification',
       Date.now(),
      { before: null, after: { title, body, target, recipientCount: eligibleRegisterIds.length } },
      `Notification "${title}" sent to ${target} (${eligibleRegisterIds.length} recipients) by ${req.user.name}`
    );

    res.status(200).json({ message: `Notifications sent to ${target}` });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
};

// Fetch Notification History for a User based on eligibility
export const getNotificationHistory = async (req, res) => {
  try {
    const { registerId } = req.query;
    if (!registerId) {
      return res.status(400).json({ error: 'registerId is required' });
    }
    // Find notifications where the recipients array includes the given registerId
    const history = await NotificationHistory.find({ recipients: registerId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
};

// Helper functions to fetch registerIds based on role or category using the User collection
const getRoleBasedRegisterIds = async (roles) => {
  try {
    const users = await User.find({ role: { $in: roles } }, 'registerId');
    return users.map((user) => user.registerId);
  } catch (error) {
    console.error('Error fetching role-based register IDs:', error);
    return [];
  }
};

const getCategoryBasedRegisterIds = async (category) => {
  try {
    const users = await User.find({ category }, 'registerId');
    return users.map((user) => user.registerId);
  } catch (error) {
    console.error('Error fetching category-based register IDs:', error);
    return [];
  }
};
