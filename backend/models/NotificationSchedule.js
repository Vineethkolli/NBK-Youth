import mongoose from 'mongoose';

const notificationScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  target: {
    type: String,
    enum: ['All', 'Youth_Villager_Category', 'Youth_Category', 'Admins_Financiers_Developers', 'Specific User'],
    default: 'All'
  },
  registerId: { type: String, default: null },
  recipients: { type: [String], default: [] },
  totalRecipients: { type: Number, default: 0 },
  failedRecipients: { type: [String], default: [] },
  scheduledAt: { type: Date, required: true },
  sendStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdBy: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

notificationScheduleSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model('NotificationSchedule', notificationScheduleSchema);
