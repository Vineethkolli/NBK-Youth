import webpush from 'web-push';
import Subscription from '../models/Notification.js';
import User from '../models/User.js';
import NotificationHistory from '../models/NotificationHistory.js';
import { logActivity } from '../middleware/activityLogger.js';
import { DateTime } from 'luxon';
import NotificationSchedule from '../models/NotificationSchedule.js';
import {
  cancelScheduledNotification,
  scheduleImmediateNotification,
  scheduleNotificationAtExactTime
} from '../services/agendaService.js';
import { getRecipientRegisterIds } from '../services/notificationService.js';

export const getPublicKey = (req, res) => {
  res.json({ publicKey: process.env.PUBLIC_VAPID_KEY });
};


export const subscribe = async (req, res) => {
  const { subscription, registerId: bodyRegisterId } = req.body;
  const authenticatedRegisterId = req.user?.registerId;

  if (!authenticatedRegisterId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (bodyRegisterId && bodyRegisterId !== authenticatedRegisterId) {
    return res.status(403).json({ error: 'registerId does not match the authenticated user' });
  }

  if (!subscription) {
    return res.status(400).json({ error: 'subscription is required' });
  }

  try {
    const existingUser = await Subscription.findOne({ registerId: authenticatedRegisterId });

    if (existingUser) {
      // Avoid duplicate subscriptions
      const isAlreadySubscribed = existingUser.subscriptions.some(
        (sub) => sub.endpoint === subscription.endpoint
      );
      if (!isAlreadySubscribed) {
        const before = existingUser.toObject();
        existingUser.subscriptions.push(subscription);
        await existingUser.save();

        await logActivity(
          req,
          'UPDATE',
          'Notification',
          authenticatedRegisterId,
          { before, after: existingUser.toObject() },
          `Added a notification subscription for ${authenticatedRegisterId}`
        );
      }
    } else {
      const createdSubscription = await Subscription.create({
        registerId: authenticatedRegisterId,
        subscriptions: [subscription]
      });

      await logActivity(
        req,
        'CREATE',
        'Notification',
        authenticatedRegisterId,
        { before: null, after: createdSubscription.toObject() },
        `Created a notification subscription for ${authenticatedRegisterId}`
      );
    }

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};


export const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  const authenticatedRegisterId = req.user?.registerId;

  if (!authenticatedRegisterId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    const existingSubscription = await Subscription.findOne({
      registerId: authenticatedRegisterId,
      'subscriptions.endpoint': endpoint
    });

    const updateResult = await Subscription.updateOne(
      { registerId: authenticatedRegisterId, 'subscriptions.endpoint': endpoint },
      { $pull: { subscriptions: { endpoint } } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ error: 'Subscription not found for this user' });
    }

    await logActivity(
      req,
      'UPDATE',
      'Notification',
      authenticatedRegisterId,
      {
        before: existingSubscription?.toObject() || null,
        after: existingSubscription
          ? {
              ...existingSubscription.toObject(),
              subscriptions: existingSubscription.subscriptions.filter(
                (subscriptionItem) => subscriptionItem.endpoint !== endpoint
              )
            }
          : null
      },
      `Removed a notification subscription for ${authenticatedRegisterId}`
    );

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};


export const sendNotification = async (req, res) => {
  const { title, body, link, target, registerId } = req.body;
  try {
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const eligibleRegisterIds = await getRecipientRegisterIds(target, registerId);
    if (!eligibleRegisterIds.length) {
      return res.status(404).json({ error: 'No eligible users found for the selected target' });
    }

    const history = await NotificationHistory.create({
      title: title.trim(),
      body: body.trim(),
      link: link?.trim() || '',
      recipients: eligibleRegisterIds,
      sentBy: req.user.registerId,
      status: 'pending'
    });

    await scheduleImmediateNotification({ historyId: history._id });

    res.status(202).json({ message: `Notification send started for ${target}` });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to start notifications' });
  }
};


export const getNotificationHistory = async (req, res) => {
  try {
    const { registerId, type = 'received' } = req.query;
    if (!registerId) {
      return res.status(400).json({ error: 'registerId is required' });
    }
    if (!['received', 'sent'].includes(type)) {
      return res.status(400).json({ error: 'type must be received or sent' });
    }

    const historyQuery = type === 'sent'
      ? { sentBy: req.user?.registerId }
      : { recipients: registerId };
    const history = await NotificationHistory.find(historyQuery).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
};

const parseScheduleDate = (scheduledAt) => {
  if (!scheduledAt) {
    const error = new Error('scheduledAt is required');
    error.statusCode = 400;
    throw error;
  }

  const date = DateTime.fromISO(scheduledAt, { zone: 'Asia/Kolkata' });
  if (!date.isValid) {
    const error = new Error('Invalid scheduled date');
    error.statusCode = 400;
    throw error;
  }
  if (date.toJSDate() <= new Date()) {
    const error = new Error('Scheduled date must be in the future');
    error.statusCode = 400;
    throw error;
  }
  return date.toJSDate();
};

const createNotificationSchedule = async ({
  req,
  title,
  message,
  link,
  target = 'All',
  registerId,
  scheduledAt
}) => {
  if (!title?.trim() || !message?.trim()) {
    const error = new Error('Title and message are required');
    error.statusCode = 400;
    throw error;
  }
  if (target === 'Specific User' && !registerId?.trim()) {
    const error = new Error('Register ID is required for the specific user');
    error.statusCode = 400;
    throw error;
  }

  const recipients = await getRecipientRegisterIds(target, registerId?.trim());
  if (!recipients.length) {
    const error = new Error('No eligible users found for the selected target');
    error.statusCode = 404;
    throw error;
  }

  const schedule = await NotificationSchedule.create({
    title: title.trim(),
    message: message.trim(),
    link: link?.trim() || '',
    target,
    registerId: target === 'Specific User' ? registerId.trim() : null,
    recipients,
    totalRecipients: recipients.length,
    scheduledAt,
    createdBy: req.user.registerId
  });

  await scheduleNotificationAtExactTime(schedule._id.toString(), scheduledAt);
  return schedule;
};

export const createScheduledNotification = async (req, res) => {
  try {
    const schedule = await createNotificationSchedule({
      req,
      ...req.body,
      scheduledAt: parseScheduleDate(req.body.scheduledAt)
    });

    await logActivity(
      req,
      'CREATE',
      'Notification',
      req.user.registerId,
      { before: null, after: schedule.toObject() },
      `Scheduled notification "${schedule.title}" for ${schedule.scheduledAt.toISOString()}`
    );
    res.status(201).json({ message: 'Notification scheduled', schedule });
  } catch (error) {
    console.error('Schedule notification error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to schedule notification' });
  }
};

export const listScheduledNotifications = async (req, res) => {
  try {
    const schedules = await NotificationSchedule.find().sort({ scheduledAt: -1 }).lean();
    res.json(schedules);
  } catch (error) {
    console.error('List notification schedules error:', error.message);
    res.status(500).json({ error: 'Failed to fetch scheduled notifications' });
  }
};

export const updateScheduledNotification = async (req, res) => {
  try {
    const schedule = await NotificationSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled notification not found' });
    if (schedule.status !== 'pending') {
      return res.status(409).json({ error: 'Sent notifications must be rescheduled' });
    }

    const replacement = await createNotificationSchedule({
      req,
      ...req.body,
      scheduledAt: parseScheduleDate(req.body.scheduledAt)
    });

    await cancelScheduledNotification(schedule._id.toString());
    await schedule.deleteOne();
    await logActivity(
      req,
      'UPDATE',
      'Notification',
      req.user.registerId,
      { before: schedule.toObject(), after: replacement.toObject() },
      `Updated scheduled notification "${replacement.title}"`
    );
    res.json({ message: 'Scheduled notification updated', schedule: replacement });
  } catch (error) {
    console.error('Update notification schedule error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update scheduled notification' });
  }
};

export const rescheduleNotification = async (req, res) => {
  try {
    const schedule = await NotificationSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled notification not found' });
    if (schedule.status === 'pending') {
      return res.status(409).json({ error: 'Pending notifications should be edited' });
    }

    const replacement = await createNotificationSchedule({
      req,
      ...req.body,
      scheduledAt: parseScheduleDate(req.body.scheduledAt)
    });
    await logActivity(
      req,
      'UPDATE',
      'Notification',
      req.user.registerId,
      { before: schedule.toObject(), after: replacement.toObject() },
      `Rescheduled notification "${replacement.title}"`
    );
    res.status(201).json({ message: 'Notification rescheduled', schedule: replacement });
  } catch (error) {
    console.error('Reschedule notification error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to reschedule notification' });
  }
};

export const deleteScheduledNotification = async (req, res) => {
  try {
    const schedule = await NotificationSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled notification not found' });

    await cancelScheduledNotification(schedule._id.toString());
    await schedule.deleteOne();
    await logActivity(
      req,
      'DELETE',
      'Notification',
      req.user.registerId,
      { before: schedule.toObject(), after: null },
      `Deleted scheduled notification "${schedule.title}"`
    );
    res.json({ message: 'Scheduled notification deleted' });
  } catch (error) {
    console.error('Delete notification schedule error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete scheduled notification' });
  }
};


// Helper functions
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
