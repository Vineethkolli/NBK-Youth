import ScheduledNotification from '../models/ScheduledNotification.js';
import Subscription from '../models/Notification.js';
import User from '../models/User.js';
import NotificationHistory from '../models/NotificationHistory.js';
import webpush from 'web-push';
import { logActivity } from '../middleware/activityLogger.js';

export const createScheduledNotification = async (req, res) => {
  try {
    const { title, message, scheduledAt } = req.body;
    if (!title || !message || !scheduledAt)
      return res.status(400).json({ error: 'Missing required fields' });

    const doc = await ScheduledNotification.create({
      title,
      message,
      scheduledAt: new Date(scheduledAt),
      createdBy: req.user?.registerId || 'SYSTEM',
      status: 'PENDING',
      sendHistory: [],
    });

    await logActivity(
      req,
      'CREATE',
      'ScheduledNotification',
      req.user?.registerId || 'SYSTEM',
      { before: null, after: doc.toObject() },
      `Created scheduled notification "${title}"`
    );

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create scheduled notification' });
  }
};


export const listScheduledNotifications = async (req, res) => {
  try {
    const docs = await ScheduledNotification.find().sort({ scheduledAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list scheduled notifications' });
  }
};


export const updateScheduledNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const oldDoc = await ScheduledNotification.findById(id);
    if (!oldDoc) return res.status(404).json({ error: 'Not found' });

    // Reset status to PENDING if scheduled date changed
    if (updates.scheduledAt && new Date(updates.scheduledAt).getTime() !== oldDoc.scheduledAt.getTime()) {
      updates.status = 'PENDING';
    }

    const doc = await ScheduledNotification.findByIdAndUpdate(id, updates, { new: true });

    await logActivity(
      req,
      'UPDATE',
      'ScheduledNotification',
      req.user?.registerId || 'SYSTEM',
      { before: oldDoc.toObject(), after: doc.toObject() },
      `Updated scheduled notification "${doc.title}"`
    );

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update scheduled notification' });
  }
};


export const deleteScheduledNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ScheduledNotification.findByIdAndDelete(id);

    await logActivity(
      req,
      'DELETE',
      'ScheduledNotification',
      req.user?.registerId || 'SYSTEM',
      { before: doc?.toObject() || null, after: null },
      `Deleted scheduled notification "${doc?.title || id}"`
    );

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete scheduled notification' });
  }
};


// Send Manually
export const sendScheduledNow = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ScheduledNotification.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const payload = JSON.stringify({ title: doc.title, body: doc.message });

    const allUsers = await User.find({}, 'registerId');
    const eligibleRegisterIds = allUsers.map(u => u.registerId);
    const subscriptionUsers = await Subscription.find({ registerId: { $in: eligibleRegisterIds } });

    const notifications = subscriptionUsers.flatMap(user =>
      user.subscriptions.map(async sub => {
        try {
          await webpush.sendNotification(sub, payload, {
            urgency: 'high'
          });
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.subscriptions = user.subscriptions.filter(s => s.endpoint !== sub.endpoint);
            await user.save();
          } else {
            console.error('Error sending notification:', error);
          }
        }
      })
    );

    await Promise.all(notifications);

    const beforeSend = doc.toObject();
    doc.sendHistory.push({ sentAt: new Date() });
    doc.status = 'SENT';
    await doc.save();

    await NotificationHistory.create({
      title: doc.title,
      body: doc.message,
      recipients: eligibleRegisterIds,
      sentBy: req.user?.registerId || 'SYSTEM',
    });

    await logActivity(
      req,
      'UPDATE',
      'ScheduledNotification',
      req.user?.registerId,
      { before: beforeSend, after: doc.toObject() },
      `Manually sent scheduled notification "${doc.title}"`
    );

    res.json({ message: 'Sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send scheduled notification' });
  }
};


// Scheduled Notifications
export const processDueNotifications = async () => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const due = await ScheduledNotification.find({
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'PENDING',
    });

    if (!due.length) return;

    for (const doc of due) {
      try {
        const payload = JSON.stringify({ title: doc.title, body: doc.message });

        const allUsers = await User.find({}, 'registerId');
        const eligibleRegisterIds = allUsers.map(u => u.registerId);
        const subscriptionUsers = await Subscription.find({ registerId: { $in: eligibleRegisterIds } });

        const notifications = subscriptionUsers.flatMap(user =>
          user.subscriptions.map(async sub => {
            try {
              await webpush.sendNotification(sub, payload, {
                urgency: 'high'
              });
            } catch (error) {
              if (error.statusCode === 410 || error.statusCode === 404) {
                user.subscriptions = user.subscriptions.filter(s => s.endpoint !== sub.endpoint);
                await user.save();
              } else {
                console.error('Error sending notification:', error);
              }
            }
          })
        );

        await Promise.all(notifications);

        const beforeSend = doc.toObject();
        doc.sendHistory.push({ sentAt: new Date() });
        doc.status = 'SENT';
        await doc.save();

        await NotificationHistory.create({
          title: doc.title,
          body: doc.message,
          recipients: eligibleRegisterIds,
          sentBy: 'SYSTEM_SCHEDULER',
        });

        const fakeReq = { user: { registerId: 'SYSTEM_SCHEDULER' } };
        await logActivity(
          fakeReq,
          'UPDATE',
          'ScheduledNotification',
          'System_Scheduler',
          { before: beforeSend, after: doc.toObject() },
          `System sent scheduled notification "${doc.title}"`
        );

      } catch (err) {
        console.error('Error processing scheduled doc', doc._id, err);
      }
    }
  } catch (err) {
    console.error('Error fetching due scheduled notifications', err);
  }
};
