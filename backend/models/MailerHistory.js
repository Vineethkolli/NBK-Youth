import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema(
  {
    registerId: { type: String, default: null },
    email: { type: String, default: null }
  },
  { _id: false }
);

const mailerHistorySchema = new mongoose.Schema(
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
    sentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailerSchedule', default: null },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    source: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate'
    }
  },
  { timestamps: true }
);

export default mongoose.model('MailerHistory', mailerHistorySchema);
