import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import NotificationHistory from '../models/NotificationHistory.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import Game from '../models/Game.js';
import ActivityLog from '../models/ActivityLog.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import { v2 as cloudinary } from 'cloudinary';

// ——— Parse Google Drive credentials from env ———
const driveCreds = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
const driveAuth = new google.auth.JWT(
  driveCreds.client_email,
  null,
  driveCreds.private_key,
  ['https://www.googleapis.com/auth/drive.metadata.readonly']
);
const drive = google.drive({ version: 'v3', auth: driveAuth });

// ——— Cloudinary config via env ———
// You already have: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name:    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:       process.env.CLOUDINARY_API_KEY,
  api_secret:    process.env.CLOUDINARY_API_SECRET,
});

export const developerController = {
  // ——— 1) Wipe Data ———
  clearData: async (req, res) => {
    const { type } = req.params;
    try {
      let description = '';
      let entity = 'DeveloperOptions';

      switch (type) {
        case 'income':
          await Income.deleteMany({});
          description = 'Cleared all income records and logs';
          break;
        case 'expense':
          await Expense.deleteMany({});
          description = 'Cleared all expense records and logs';
          break;
        case 'notifications':
          await NotificationHistory.deleteMany({});
          description = 'Cleared all notification subscriptions and history';
          break;
        case 'estimatedIncome':
          await EstimatedIncome.deleteMany({});
          description = 'Cleared all estimated income records';
          break;
        case 'estimatedExpense':
          await EstimatedExpense.deleteMany({});
          description = 'Cleared all estimated expense records';
          break;
        case 'letsPlay':
          await Game.deleteMany({});
          description = 'Cleared all game data (letsPlay)';
          break;
        case 'activityLog':
          await ActivityLog.deleteMany({});
          description = 'Cleared all activity logs';
          break;
        case 'events':
          await Event.deleteMany({});
          description = 'Cleared all events';
          break;
        case 'resetRoles':
          const result = await User.updateMany(
            { role: { $ne: 'developer' } },
            { $set: { role: 'user' } }
          );
          description = `Reset roles of ${result.modifiedCount} users (except developers) to 'user'`;
          break;
        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }

      await logActivity(
        req,
        'DELETE',
        entity,
        req.user?.registerId || 'SYSTEM',
        null,
        description
      );
      res.json({ message: `${type} action completed successfully` });
    } catch (error) {
      console.error('Clear data error:', error);
      res.status(500).json({ message: `Failed to process ${type} action` });
    }
  },

  // ——— 2) MongoDB Stats ———
  getMongoStats: async (req, res) => {
    try {
      const stats = await mongoose.connection.db.stats();
      const payload = {
        collections:    stats.collections,
        storageSizeMB:  (stats.storageSize / 1024 / 1024).toFixed(2),
      };
      
      res.json(payload);
    } catch (error) {
      console.error('Mongo stats error:', error);
      res.status(500).json({ message: 'Failed to fetch MongoDB stats' });
    }
  },

  // ——— 3) Google Drive Storage Stats ———
  getDriveStats: async (req, res) => {
    try {
      const { data } = await drive.about.get({ fields: 'storageQuota' });
      const { usageInDrive, limit } = data.storageQuota;
      const usedMB  = (Number(usageInDrive) / 1024 / 1024).toFixed(2);
      const limitMB = limit ? (Number(limit) / 1024 / 1024).toFixed(2) : 'unlimited';

      
      res.json({ usedMB, limitMB, unit: 'MB' });
    } catch (error) {
      console.error('Drive stats error:', error);
      res.status(500).json({ message: 'Failed to fetch Drive stats' });
    }
  },

  // ——— 4) Cloudinary Storage Stats ———
// ——— 4) Cloudinary Storage Stats ———
getCloudinaryStats: async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();
    // cloudinary returns usage.storage.bytes and usage.storage.allowed_bytes,
    // and the timestamp under usage.storage.last_updated
    const bytesUsed = Number(usage.storage?.bytes) || 0;
    const allowedBytes = Number(usage.storage?.allowed_bytes) || null;

    const usedMB  = (bytesUsed / 1024 / 1024).toFixed(2);
    const limitMB = allowedBytes
      ? (allowedBytes / 1024 / 1024).toFixed(2)
      : 'unlimited';

    res.json({
      usedMB,
      limitMB,
      unit: 'MB',
    });
  } catch (error) {
    console.error('Cloudinary stats error:', error);
    res.status(500).json({ message: 'Failed to fetch Cloudinary stats' });
  }
},
};
