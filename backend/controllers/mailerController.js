import { DateTime } from 'luxon';
import MailerSchedule from '../models/MailerSchedule.js';
import MailerHistory from '../models/MailerHistory.js';
import User from '../models/User.js';
import {
  scheduleImmediateEmail,
  scheduleEmailAtExactTime,
  cancelScheduledEmail
} from '../services/agendaService.js';
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
  const { subject, content, footer, bodyFormat } = body;

  if (!subject?.trim() || !content?.trim() || !footer?.trim()) {
    const error = new Error('Subject, body, and footer are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    subject: subject.trim(),
    body: content.trim(),
    footer: footer.trim(),
    bodyFormat: bodyFormat === 'html' ? 'html' : 'text'
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

    const scheduledAt = DateTime.fromISO(scheduleDate, { zone: 'Asia/Kolkata' });

    if (!scheduledAt.isValid) {
      return res.status(400).json({ error: 'Invalid schedule date' });
    }

    if (scheduledAt.toJSDate() <= new Date()) {
      return res.status(400).json({ error: 'Schedule date must be in the future' });
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

    await scheduleEmailAtExactTime(schedule._id, scheduledAt.toJSDate());

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

const parseScheduleDate = (scheduleDate) => {
  if (!scheduleDate) {
    const error = new Error('scheduleDate is required');
    error.statusCode = 400;
    throw error;
  }

  const scheduledAt = DateTime.fromISO(scheduleDate, { zone: 'Asia/Kolkata' });
  if (!scheduledAt.isValid) {
    const error = new Error('Invalid schedule date');
    error.statusCode = 400;
    throw error;
  }
  if (scheduledAt.toJSDate() <= new Date()) {
    const error = new Error('Schedule date must be in the future');
    error.statusCode = 400;
    throw error;
  }
  return scheduledAt.toJSDate();
};

const createSchedule = async ({ req, emailPayload, target, registerId, email, scheduledAt }) => {
  const recipients = await buildRecipients({ target, registerId, email });
  if (!recipients.length) {
    const error = new Error('No eligible recipients found');
    error.statusCode = 404;
    throw error;
  }

  const schedule = await MailerSchedule.create({
    senderRegisterId: req.user.registerId,
    ...emailPayload,
    targetType: target,
    recipients,
    totalRecipients: recipients.length,
    scheduledAt,
    status: 'pending'
  });

  await scheduleEmailAtExactTime(schedule._id, scheduledAt);
  return schedule;
};

export const updateScheduledEmail = async (req, res) => {
  try {
    const schedule = await MailerSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled email not found' });
    if (schedule.status !== 'pending') {
      return res.status(409).json({ error: 'Sent emails must be rescheduled' });
    }

    const { target, registerId, email, scheduleDate } = req.body;
    const scheduledAt = parseScheduleDate(scheduleDate);
    const emailPayload = buildEmailPayload(req.body);
    const replacement = await createSchedule({
      req, emailPayload, target, registerId, email, scheduledAt
    });

    await cancelScheduledEmail(schedule._id.toString());
    await MailerSchedule.findByIdAndDelete(schedule._id);
    res.json({ message: 'Scheduled email updated', schedule: replacement });
  } catch (error) {
    console.error('Update scheduled email error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update scheduled email' });
  }
};

export const rescheduleEmail = async (req, res) => {
  try {
    const schedule = await MailerSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled email not found' });
    if (schedule.status === 'pending') {
      return res.status(409).json({ error: 'Pending emails should be edited' });
    }

    const { target, registerId, email, scheduleDate } = req.body;
    const replacement = await createSchedule({
      req,
      emailPayload: buildEmailPayload(req.body),
      target,
      registerId,
      email,
      scheduledAt: parseScheduleDate(scheduleDate)
    });
    res.status(201).json({ message: 'Email rescheduled', schedule: replacement });
  } catch (error) {
    console.error('Reschedule email error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to reschedule email' });
  }
};

export const deleteScheduledEmail = async (req, res) => {
  try {
    const schedule = await MailerSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Scheduled email not found' });

    await cancelScheduledEmail(schedule._id.toString());
    await schedule.deleteOne();
    res.json({ message: 'Scheduled email deleted' });
  } catch (error) {
    console.error('Delete scheduled email error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to delete scheduled email' });
  }
};
