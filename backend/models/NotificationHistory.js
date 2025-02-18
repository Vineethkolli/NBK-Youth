import mongoose from 'mongoose';

const notificationHistorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    recipients: { type: [String], required: true }, // Array of all eligible user register IDs
    sentBy: { type: String, required: true }, 
  },
  { timestamps: true }
);

export default mongoose.model('NotificationHistory', notificationHistorySchema);