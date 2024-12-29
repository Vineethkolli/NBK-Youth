import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
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
import { createDefaultDeveloper } from './utils/setupDefaults.js';

// Load environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Web Push Notification Setup
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:example@yourdomain.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
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