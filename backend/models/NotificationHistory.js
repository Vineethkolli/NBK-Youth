import mongoose from 'mongoose';

const notificationHistorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, required: false },
    recipients: { type: [String], required: true },
    sentBy: { type: String, required: true }, 
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationSchedule',
      default: null
    },
    source: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate'
    },
    failedRecipients: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'sending', 'completed', 'failed'],
      default: 'pending'
    },
  },
  { timestamps: true }
);

notificationHistorySchema.index({ recipients: 1, createdAt: -1 });

export default mongoose.model('NotificationHistory', notificationHistorySchema);