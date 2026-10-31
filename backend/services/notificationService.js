import webpush from 'web-push';
import Subscription from '../models/Notification.js';
import User from '../models/User.js';

export const getRecipientRegisterIds = async (target = 'All', registerId) => {
  if (target === 'All') {
    const users = await User.find({}, 'registerId').lean();
    return users.map((user) => user.registerId);
  }

  if (target === 'Admins_Financiers_Developers') {
    const users = await User.find(
      { role: { $in: ['admin', 'financier', 'developer'] } },
      'registerId'
    ).lean();
    return users.map((user) => user.registerId);
  }

  if (target === 'Youth_Category' || target === 'Youth_Villager_Category') {
    const categories = target === 'Youth_Category'
      ? ['youth']
      : ['youth', 'villager'];
    const users = await User.find(
      { category: { $in: categories } },
      'registerId'
    ).lean();
    return users.map((user) => user.registerId);
  }

  if (target === 'Specific User' && registerId) {
    const user = await User.findOne({ registerId }, 'registerId').lean();
    if (!user) {
      const error = new Error('User does not exist');
      error.statusCode = 404;
      throw error;
    }
    return [user.registerId];
  }

  const error = new Error('Invalid target selection');
  error.statusCode = 400;
  throw error;
};

export const sendNotificationPayload = async ({ title, body, link, target, registerId, recipientRegisterIds }) => {
  const recipients = recipientRegisterIds || await getRecipientRegisterIds(target, registerId);
  if (!recipients.length) {
    const error = new Error('No eligible users found for the selected target');
    error.statusCode = 404;
    throw error;
  }

  const subscriptionUsers = await Subscription.find({
    registerId: { $in: recipients }
  });
  const failedRecipients = new Set();
  const payload = JSON.stringify({ title, body, link: link || '' });

  await Promise.all(subscriptionUsers.map(async (user) => {
    let hasRemoved = false;

    await Promise.all(user.subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload, {
          urgency: 'high',
          TTL: 1296000
        });
      } catch (error) {
        failedRecipients.add(user.registerId);
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscription._remove = true;
          hasRemoved = true;
        } else {
          console.error('Error sending notification:', error);
        }
      }
    }));

    if (hasRemoved) {
      user.subscriptions = user.subscriptions.filter((subscription) => !subscription._remove);
      await user.save();
    }
  }));

  return {
    recipients,
    failedRecipients: [...failedRecipients]
  };
};
