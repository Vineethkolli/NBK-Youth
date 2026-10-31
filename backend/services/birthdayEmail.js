import { DateTime } from 'luxon';
import MailerHistory from '../models/MailerHistory.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { sendEmailsSequential } from './mailerService.js';

const BIRTHDAY_TIMEZONE = 'Asia/Kolkata';
const BIRTHDAY_REGEX = /^(\d{2})-(\d{2})(?:-\d{4})?$/;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBirthdayEmailBody = ({ name, profileImage }) => {
  const safeName = escapeHtml(name);
  const imageUrl = /^https?:\/\//i.test(profileImage || '') ? escapeHtml(profileImage) : '';
  const initials = escapeHtml(
    String(name)
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );
  const profileMarkup = imageUrl
    ? `<img src="${imageUrl}" alt="${safeName}" width="112" height="112" style="display:block;width:112px;height:112px;border-radius:56px;border:4px solid #ffffff;object-fit:cover;" />`
    : `<div style="width:112px;height:112px;border-radius:56px;background:#ffffff;color:#7c3aed;font-size:34px;font-weight:700;line-height:112px;text-align:center;">${initials}</div>`;

  return `
<div style="max-width:520px;margin:0 auto;text-align:center;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="padding:28px 20px;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;color:#ffffff;">
    <div style="display:inline-block;margin-bottom:18px;">${profileMarkup}</div>
    <p style="margin:0 0 8px;font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:.9;">Today is your special day</p>
    <h2 style="margin:0;font-size:30px;line-height:1.2;">Happy Birthday, ${safeName}!</h2>
  </div>
  <div style="padding:28px 12px 8px;color:#374151;">
    <p style="margin:0 0 14px;font-size:18px;line-height:1.6;">Wishing you a wonderful birthday filled with happiness, good health, and beautiful memories.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#6b7280;">Thank you for being a valued member of the NBK Youth family. Have an amazing year ahead!</p>
  </div>
</div>`;
};

const parseBirthday = (birthday) => {
  const match = String(birthday || '').match(BIRTHDAY_REGEX);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const validDate = new Date(2000, month - 1, day);
  if (validDate.getDate() !== day || validDate.getMonth() !== month - 1) return null;

  return { day, month };
};

const logBirthdayEmailActivity = async ({ history, user, year, status, description }) => {
  try {
    await ActivityLog.create({
      action: status === 'completed' ? 'CREATE' : 'UPDATE',
      entityType: 'Mailer',
      entityId: history._id.toString(),
      registerId: user.registerId || 'SYSTEM',
      userName: user.name || 'NA',
      changes: {
        before: null,
        after: {
          subject: history.subject,
          recipient: user.email,
          birthdayYear: year,
          status
        }
      },
      description
    });
  } catch (error) {
    console.error('Failed to log birthday email activity:', error.message);
  }
};

const claimBirthdayHistory = async ({ user, year, subject, body, footer }) => {
  const birthdayKey = `${user.registerId}:${year}`;
  const existing = await MailerHistory.findOne({ birthdayKey });

  if (existing) {
    if (existing.status === 'completed' || existing.status === 'sending') return null;

    return MailerHistory.findOneAndUpdate(
      { _id: existing._id, status: { $in: ['pending', 'failed'] } },
      { $set: { status: 'sending', sentAt: new Date() } },
      { returnDocument: 'after' }
    );
  }

  try {
    return await MailerHistory.create({
      senderRegisterId: process.env.BIRTHDAY_EMAIL_SENDER_REGISTER_ID || 'SYSTEM',
      subject,
      body,
      bodyFormat: 'html',
      footer,
      targetType: 'RegisterId',
      recipients: [{ registerId: user.registerId, email: user.email }],
      totalRecipients: 1,
      sentAt: new Date(),
      status: 'sending',
      source: 'birthday',
      birthdayKey
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return null;
  }
};

export const sendBirthdayEmails = async (referenceDate = DateTime.now()) => {
  const now = referenceDate.setZone(BIRTHDAY_TIMEZONE);
  const users = await User.find({
    registerId: { $exists: true, $nin: [null, ''] },
    email: { $exists: true, $nin: [null, ''] },
    birthday: { $regex: /^\d{2}-\d{2}(?:-\d{4})?$/ }
  }).select('registerId name email birthday profileImage').lean();

  const birthdayUsers = users.filter((user) => {
    const birthday = parseBirthday(user.birthday);
    return birthday?.day === now.day && birthday?.month === now.month;
  });

  for (const user of birthdayUsers) {
    const subject = `Happy Birthday, ${user.name}!`;
    const body = getBirthdayEmailBody(user);
    const footer = 'With warm wishes, NBK Youth Gangavaram';
    const history = await claimBirthdayHistory({
      user,
      year: now.year,
      subject,
      body,
      footer
    });

    if (!history) continue;

    const { failedRecipients } = await sendEmailsSequential({
      recipients: history.recipients,
      subject: history.subject,
      body: history.body,
      bodyFormat: history.bodyFormat,
      footer: history.footer
    });

    history.failedRecipients = failedRecipients;
    history.completedAt = new Date();
    history.status = failedRecipients.length === 0 ? 'completed' : 'failed';
    await history.save();

    await logBirthdayEmailActivity({
      history,
      user,
      year: now.year,
      status: history.status,
      description: `Birthday email ${history.status} for ${user.name} (${now.year})`
    });
  }
};
