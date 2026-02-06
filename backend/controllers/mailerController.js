import { DateTime } from 'luxon';
import MailerSchedule from '../models/MailerSchedule.js';
import MailerHistory from '../models/MailerHistory.js';
import User from '../models/User.js';
import { scheduleImmediateEmail } from '../services/agendaService.js';
import { logActivity } from '../middleware/activityLogger.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeRecipients = (recipients) => {
  const seen = new Set();
  const unique = [];

  for (const recipient of recipients) {
    const key = recipient.email || recipient.registerId;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(recipient);
  }

  return unique;
};

const buildRecipients = async ({ target, registerId, email }) => {
  if (target === 'All') {
    const users = await User.find({
      email: { $exists: true, $ne: null, $ne: '' }
    }).select('registerId email').lean();

    const recipients = users.map((user) => ({
      registerId: user.registerId,
      email: user.email
    }));

    return normalizeRecipients(recipients);
  }

  if (target === 'RegisterId') {
    if (!registerId) {
      const error = new Error('registerId is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ registerId }).select('registerId email').lean();
    if (!user) {
      const error = new Error('User does not exist');
      error.statusCode = 404;
      throw error;
    }

    if (!user.email) {
      const error = new Error('User does not have an email address');
      error.statusCode = 400;
      throw error;
    }

    return [{ registerId: user.registerId, email: user.email }];
  }

  if (target === 'Email') {
    if (!email || !emailRegex.test(email.trim())) {
      const error = new Error('Valid email is required');
      error.statusCode = 400;
      throw error;
    }

    return [{ registerId: null, email: email.trim().toLowerCase() }];
  }

  const error = new Error('Invalid target');
  error.statusCode = 400;
  throw error;
};

const buildEmailPayload = (body) => {
  const { subject, content, footer } = body;

  if (!subject?.trim() || !content?.trim() || !footer?.trim()) {
    const error = new Error('Subject, body, and footer are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    subject: subject.trim(),
    body: content.trim(),
    footer: footer.trim()
  };
};

export const sendEmailNow = async (req, res) => {
  try {
    const { target, registerId, email } = req.body;
    const emailPayload = buildEmailPayload(req.body);

    const recipients = await buildRecipients({ target, registerId, email });
    if (!recipients.length) {
      return res.status(404).json({ error: 'No eligible recipients found' });
    }

    const history = await MailerHistory.create({
      senderRegisterId: req.user.registerId,
      ...emailPayload,
      targetType: target,
      recipients,
      totalRecipients: recipients.length,
      status: 'pending',
      sentAt: new Date(),
      source: 'immediate'
    });

    await scheduleImmediateEmail(history._id);

    await logActivity(
      req,
      'CREATE',
      'Mailer',
      req.user.registerId,
      { before: null, after: { subject: emailPayload.subject, target } },
      `Email send initiated by ${req.user.name} to ${target}`
    );

    res.status(202).json({ message: 'Email send started', history });
  } catch (error) {
    console.error('Send email error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to send email' });
  }
};

export const scheduleEmail = async (req, res) => {
  try {
    const { target, registerId, email, scheduleDate } = req.body;
    const emailPayload = buildEmailPayload(req.body);

    if (!scheduleDate) {
      return res.status(400).json({ error: 'scheduleDate is required' });
    }

    const scheduledAt = DateTime.fromISO(scheduleDate, { zone: 'Asia/Kolkata' })
      .set({ hour: 1, minute: 0, second: 0, millisecond: 0 });

    if (!scheduledAt.isValid) {
      return res.status(400).json({ error: 'Invalid schedule date' });
    }

    const recipients = await buildRecipients({ target, registerId, email });
    if (!recipients.length) {
      return res.status(404).json({ error: 'No eligible recipients found' });
    }

    const schedule = await MailerSchedule.create({
      senderRegisterId: req.user.registerId,
      ...emailPayload,
      targetType: target,
      recipients,
      totalRecipients: recipients.length,
      scheduledAt: scheduledAt.toJSDate(),
      status: 'pending'
    });

    await logActivity(
      req,
      'CREATE',
      'Mailer',
      req.user.registerId,
      { before: null, after: { subject: emailPayload.subject, scheduledAt: schedule.scheduledAt } },
      `Scheduled email by ${req.user.name} for ${schedule.scheduledAt.toISOString()}`
    );

    res.status(201).json({ message: 'Email scheduled', schedule });
  } catch (error) {
    console.error('Schedule email error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to schedule email' });
  }
};

export const listScheduledEmails = async (req, res) => {
  try {
    const schedules = await MailerSchedule.find().sort({ scheduledAt: -1 }).lean();
    res.json(schedules);
  } catch (error) {
    console.error('List schedules error:', error.message);
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
};

export const listEmailHistory = async (req, res) => {
  try {
    const history = await MailerHistory.find().sort({ sentAt: -1, createdAt: -1 }).lean();
    res.json(history);
  } catch (error) {
    console.error('List history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch email history' });
  }
};
