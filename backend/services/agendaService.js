import Agenda from 'agenda';
import { DateTime } from 'luxon';
import MailerSchedule from '../models/MailerSchedule.js';
import MailerHistory from '../models/MailerHistory.js';
import { sendEmailsSequential } from './mailerService.js';

let agendaInstance = null;

const computeStatus = (totalRecipients, failedCount) => {
  if (failedCount === 0) {
    return 'completed';
  }
  return 'failed';
};

const updateHistoryAfterSend = async ({
  history,
  failedRecipients
}) => {
  history.failedRecipients = failedRecipients;
  history.completedAt = new Date();
  history.status = computeStatus(history.totalRecipients, failedRecipients.length);
  await history.save();
};

const updateScheduleAfterSend = async ({
  schedule,
  failedRecipients
}) => {
  schedule.failedRecipients = failedRecipients;
  schedule.completedAt = new Date();
  schedule.status = computeStatus(schedule.totalRecipients, failedRecipients.length);
  await schedule.save();
};

const defineJobs = (agenda) => {
  agenda.define('send-immediate-email', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async (job) => {
    const { historyId } = job.attrs.data || {};
    if (!historyId) return;

    const history = await MailerHistory.findById(historyId);
    if (!history || history.status === 'completed') return;

    history.sentAt = history.sentAt || new Date();
    history.status = 'pending';
    await history.save();

    const { failedRecipients } = await sendEmailsSequential({
      recipients: history.recipients,
      subject: history.subject,
      body: history.body,
      footer: history.footer
    });

    await updateHistoryAfterSend({ history, failedRecipients });
  });

  agenda.define('send-scheduled-email', { concurrency: 1, lockLifetime: 60 * 60 * 1000 }, async (job) => {
    const { scheduleId } = job.attrs.data || {};
    if (!scheduleId) return;

    const schedule = await MailerSchedule.findById(scheduleId);
    if (!schedule || schedule.status === 'completed') return;

    schedule.sendStartedAt = new Date();
    schedule.status = 'pending';
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
      status: computeStatus(schedule.totalRecipients, failedRecipients.length),
      source: 'scheduled'
    });

    schedule.historyId = history._id;
    await updateScheduleAfterSend({ schedule, failedRecipients });
  });

};

export const startAgenda = async () => {
  if (agendaInstance) return agendaInstance;

  agendaInstance = new Agenda({
    db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' },
    processEvery: '5 minutes'
  });

  defineJobs(agendaInstance);

  await agendaInstance.start();

  return agendaInstance;
};

export const scheduleImmediateEmail = async (historyId) => {
  if (!agendaInstance) {
    throw new Error('Agenda is not started');
  }
  await agendaInstance.now('send-immediate-email', { historyId });
};

export const scheduleEmailAtExactTime = async (scheduleId, scheduledAt) => {
  if (!agendaInstance) {
    throw new Error('Agenda is not started');
  }
  await agendaInstance.schedule(scheduledAt, 'send-scheduled-email', { scheduleId });
};
