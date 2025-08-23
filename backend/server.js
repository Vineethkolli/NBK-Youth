import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payment.js';
import paymentDetailsRoutes from './routes/paymentDetails.js';
import incomeRoutes from './routes/incomes.js';
import expenseRoutes from './routes/expenses.js';
import verificationRoutes from './routes/verification.js';
import statsRoutes from './routes/stats.js';
import developerRoutes from './routes/developer.js';
import collectionRoutes from './routes/collections.js';
import hiddenProfileRoutes from './routes/hiddenProfiles.js';
import homepageRoutes from './routes/homepage.js';
import momentsRoutes from './routes/moments.js';
import gameRoutes from './routes/games.js';
import notificationRoutes from './routes/notifications.js';
import { createDefaultDeveloper } from './utils/setupDefaults.js';
import maintenanceRoutes from './routes/maintenance.js';
import estimationRoutes from './routes/estimation.js';
import bannerRoutes from './routes/banners.js';
import activityLogRoutes from './routes/activityLogs.js';
import committeeRoutes from './routes/committee.js';
import eventLabelRoutes from './routes/eventLabel.js';
import lockSettingsRoutes from './routes/lockSettings.js';
import viniRoutes from './routes/vini.js';
import recordsRoutes from './routes/records.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set VAPID details
if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  console.error('Missing VAPID keys in environment variables');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:youremail@example.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-details', paymentDetailsRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/hidden-profiles', hiddenProfileRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/event-label', eventLabelRoutes);
app.use('/api/lock-settings', lockSettingsRoutes);
app.use('/api/vini', viniRoutes);
app.use('/api/records', recordsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    createDefaultDeveloper();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});