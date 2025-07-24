import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true,
    unique: false, // Multiple devices for the same user
  },
  subscriptions: [
    {
      endpoint: { type: String, required: true },
      keys: {
        auth: { type: String, required: true },
        p256dh: { type: String, required: true }
      }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
