import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import webpush from 'web-push';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { createDefaultDeveloper } from './utils/setupDefaults.js';

// Load environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Web Push Notification Setup
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
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