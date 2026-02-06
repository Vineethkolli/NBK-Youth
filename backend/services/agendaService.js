import Agenda from 'agenda';
import { DateTime } from 'luxon';
import MailerSchedule from '../models/MailerSchedule.js';
import MailerHistory from '../models/MailerHistory.js';
import { sendEmailsSequential } from './mailerService.js';

let agendaInstance = null;

const getDayBounds = () => {
  const now = DateTime.now().setZone('Asia/Kolkata');
  return {
    startOfDay: now.startOf('day').toJSDate(),
    endOfDay: now.endOf('day').toJSDate()
  };
};

const computeStatus = (totalRecipients, failedCount, isRetry = false) => {
  if (failedCount === 0) {
    return isRetry ? 'retry_completed' : 'completed';
  }
  if (failedCount === totalRecipients) {
    return 'failed';
  }
  return isRetry ? 'failed' : 'partially_failed';
};

const updateHistoryAfterSend = async ({
  history,
  failedRecipients,
  isRetry = false
}) => {
  history.failedRecipients = failedRecipients;
  history.completedAt = new Date();
  history.status = computeStatus(history.totalRecipients, failedRecipients.length, isRetry);
  await history.save();
};

const updateScheduleAfterSend = async ({
  schedule,
  failedRecipients,
  isRetry = false
}) => {
  schedule.failedRecipients = failedRecipients;
  schedule.completedAt = new Date();
  schedule.status = computeStatus(schedule.totalRecipients, failedRecipients.length, isRetry);
  if (isRetry) {
    schedule.lastRetryAt = new Date();
  }
  await schedule.save();
};

const defineJobs = (agenda) => {
  agenda.define('send-immediate-email', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async (job) => {
    const { historyId } = job.attrs.data || {};
    if (!historyId) return;

    const history = await MailerHistory.findById(historyId);
    if (!history || ['completed', 'retry_completed'].includes(history.status)) return;

    history.sentAt = history.sentAt || new Date();
    history.status = 'pending';
    await history.save();

    const { failedRecipients } = await sendEmailsSequential({
      recipients: history.recipients,
      subject: history.subject,
      body: history.body,
      footer: history.footer
    });

    await updateHistoryAfterSend({ history, failedRecipients, isRetry: false });

    if (failedRecipients.length > 0 && agendaInstance) {
      const retryAt = DateTime.now().plus({ minutes: 5 }).toJSDate();
      await agendaInstance.schedule(retryAt, 'retry-immediate-email', { historyId });
    }
  });

  agenda.define('retry-immediate-email', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async (job) => {
    const { historyId } = job.attrs.data || {};
    if (!historyId) return;

    const history = await MailerHistory.findById(historyId);
    if (!history || !['partially_failed', 'failed'].includes(history.status)) return;

    if (!history.failedRecipients?.length) {
      history.status = 'retry_completed';
      history.completedAt = new Date();
      await history.save();
      return;
    }

    const { failedRecipients } = await sendEmailsSequential({
      recipients: history.failedRecipients,
      subject: history.subject,
      body: history.body,
      footer: history.footer
    });

    history.failedRecipients = failedRecipients;
    await updateHistoryAfterSend({ history, failedRecipients, isRetry: true });
  });

  agenda.define('process-scheduled-emails', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async () => {
    const { startOfDay, endOfDay } = getDayBounds();

    const schedules = await MailerSchedule.find({
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'pending'
    });

    for (const schedule of schedules) {
      schedule.sendStartedAt = new Date();
      await schedule.save();

      const { failedRecipients } = await sendEmailsSequential({
        recipients: schedule.recipients,
        subject: schedule.subject,
        body: schedule.body,
        footer: schedule.footer
      });

      const history = await MailerHistory.create({
        senderRegisterId: schedule.senderRegisterId,
        subject: schedule.subject,
        body: schedule.body,
        footer: schedule.footer,
        targetType: schedule.targetType,
        recipients: schedule.recipients,
        totalRecipients: schedule.totalRecipients,
        failedRecipients,
        sentAt: schedule.sendStartedAt,
        completedAt: new Date(),
        scheduleId: schedule._id,
        status: computeStatus(schedule.totalRecipients, failedRecipients.length, false),
        source: 'scheduled'
      });

      schedule.historyId = history._id;
      await updateScheduleAfterSend({ schedule, failedRecipients, isRetry: false });
    }
  });

  agenda.define('retry-scheduled-emails', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async () => {
    const { startOfDay, endOfDay } = getDayBounds();

    const schedules = await MailerSchedule.find({
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['partially_failed', 'failed'] }
    });

    for (const schedule of schedules) {
      if (!schedule.failedRecipients?.length) {
        schedule.status = 'retry_completed';
        schedule.lastRetryAt = new Date();
        await schedule.save();
        continue;
      }

      const { failedRecipients } = await sendEmailsSequential({
        recipients: schedule.failedRecipients,
        subject: schedule.subject,
        body: schedule.body,
        footer: schedule.footer
      });

      await updateScheduleAfterSend({ schedule, failedRecipients, isRetry: true });

      if (schedule.historyId) {
        const history = await MailerHistory.findById(schedule.historyId);
        if (history) {
          history.failedRecipients = failedRecipients;
          history.completedAt = schedule.completedAt;
          history.status = schedule.status;
          await history.save();
        }
      }
    }
  });
};

export const startAgenda = async () => {
  if (agendaInstance) return agendaInstance;

  agendaInstance = new Agenda({
    db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' },
    processEvery: '1 minute'
  });

  defineJobs(agendaInstance);

  await agendaInstance.start();

  await agendaInstance.every('0 1 * * *', 'process-scheduled-emails', null, {
    timezone: 'Asia/Kolkata'
  });
  await agendaInstance.every('20 1 * * *', 'retry-scheduled-emails', null, {
    timezone: 'Asia/Kolkata'
  });

  return agendaInstance;
};

export const scheduleImmediateEmail = async (historyId) => {
  if (!agendaInstance) {
    throw new Error('Agenda is not started');
  }
  await agendaInstance.now('send-immediate-email', { historyId });
};
