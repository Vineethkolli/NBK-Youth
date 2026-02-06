import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema(
  {
    registerId: { type: String, default: null },
    email: { type: String, default: null }
  },
  { _id: false }
);

const mailerScheduleSchema = new mongoose.Schema(
  {
    senderRegisterId: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    footer: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['All', 'RegisterId', 'Email'],
      required: true
    },
    recipients: { type: [recipientSchema], default: [] },
    totalRecipients: { type: Number, default: 0 },
    failedRecipients: { type: [recipientSchema], default: [] },
    scheduledAt: { type: Date, required: true },
    sendStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    historyId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailerHistory', default: null },
    status: {
      type: String,
      enum: ['pending', 'completed', 'partially_failed', 'retry_completed', 'failed'],
      default: 'pending'
    },
    lastRetryAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('MailerSchedule', mailerScheduleSchema);
