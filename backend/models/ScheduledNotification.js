import mongoose from 'mongoose';

const scheduledNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  createdBy: { type: String },
  status: { type: String, enum: ['PENDING', 'SENT'], default: 'PENDING' },
  sendHistory: [
    {
      sentAt: Date,
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('ScheduledNotification', scheduledNotificationSchema);
