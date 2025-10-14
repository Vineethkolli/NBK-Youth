import mongoose from 'mongoose';
import { processDueNotifications } from '../controllers/scheduledNotificationController.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await processDueNotifications();

    await mongoose.disconnect();
    console.log('Scheduler finished');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
