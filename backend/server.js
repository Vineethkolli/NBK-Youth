import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import cron from 'node-cron';
import helmet from "helmet";
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import paymentRoutes from './routes/payment.js';
import paymentDetailsRoutes from './routes/paymentDetails.js';
import incomeRoutes from './routes/incomes.js';
import expenseRoutes from './routes/expenses.js';
import verificationRoutes from './routes/verification.js';
import statsRoutes from './routes/stats.js';
import developerRoutes from './routes/developer.js';
import vibeRoutes from './routes/vibe.js';
import hiddenProfileRoutes from './routes/hiddenProfiles.js';
import homepageRoutes from './routes/homepage.js';
import momentsRoutes from './routes/moments.js';
import gameRoutes from './routes/games.js';
import notificationRoutes from './routes/notifications.js';
import scheduledNotificationRoutes from './routes/scheduledNotifications.js';
import maintenanceRoutes from './routes/maintenance.js';
import estimationRoutes from './routes/estimation.js';
import bannerRoutes from './routes/banners.js';
import activityLogRoutes from './routes/activityLogs.js';
import committeeRoutes from './routes/committee.js';
import eventLabelRoutes from './routes/eventLabel.js';
import lockSettingsRoutes from './routes/lockSettings.js';
import viniRoutes from './routes/vini.js';
import recordsRoutes from './routes/records.js';
import snapshotRoutes from './routes/snapshots.js';
import historiesRoutes from './routes/histories.js';
import cloudinaryRoutes from './routes/cloudinary.js';
import monitorRoutes from './routes/monitor.js';
import emailSenderRoutes from './routes/emailSender.js';
import { processDueNotifications } from './controllers/scheduledNotificationController.js';
import { createDefaultDeveloper } from './utils/setupDefaults.js';
import { startAgenda } from './services/agendaService.js';

dotenv.config({ quiet: true });
const app = express();

app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Headers Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Environment variables validation
const requiredVars = [ 'FRONTEND_URL', 'MONGODB_URI', 'JWT_SECRET', 'PUBLIC_VAPID_KEY', 'PRIVATE_VAPID_KEY',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_DRIVE_CREDENTIALS', 'GOOGLE_DRIVE_FOLDER_ID',
   'DEFAULT_DEVELOPER_PASSWORD' ];
requiredVars.forEach(v => {
  if (!process.env[v]) {
    console.error(`Missing required environment variable: ${v}`);
    process.exit(1);
  }
});

// Web Push Configuration
webpush.setVapidDetails( 'mailto:gangavaramnbkyouth@gmail.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL, 
  credentials: true 
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));      
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-details', paymentDetailsRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/collections', vibeRoutes);
app.use('/api/hidden-profiles', hiddenProfileRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scheduled-notifications', scheduledNotificationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/event-label', eventLabelRoutes);
app.use('/api/lock-settings', lockSettingsRoutes);
app.use('/api/vini', viniRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/histories', historiesRoutes);
app.use('/api/uploads', cloudinaryRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/email-sender', emailSenderRoutes);

// Health Check
app.get('/', (req, res) => res.json({ status: 'API is running' }));
app.get('/health', (req, res) => res.status(200).send('Ok'));

// MongoDB Connection with Pooling
const mongooseOptions = {
  maxPoolSize: 400,
  minPoolSize: 15,
  maxIdleTimeMS: 60000,
  family: 4,
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    createDefaultDeveloper();
    startAgenda().catch((err) => {
      console.error('Agenda failed to start:', err.message);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); 
  });

// Notification Scheduler runs at 7:00, 7:10, 7:25 AM IST every day
cron.schedule('0,10,25 7 * * *', async () => {
  try {
    console.log('Running scheduled notifications');
    await processDueNotifications();
  } catch (err) {
    console.error('Scheduled job error:', err);
  }
}, {
  timezone: 'Asia/Kolkata'
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
