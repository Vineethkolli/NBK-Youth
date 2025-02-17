import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const createDefaultDeveloper = async () => {
  try {
    // Initialize counter for registerId
    const Counter = mongoose.model('Counter');
    await Counter.findByIdAndUpdate(
      'registerId',
      { $setOnInsert: { seq: 0 } },
      { upsert: true, new: true }
    );

    const existingDev = await User.findOne({ email: 'gangavaramnbkyouth@gmail.com' });
    if (!existingDev) {
      await User.create({
        name: 'Dev Vineeth',
        email: 'gangavaramnbkyouth@gmail.com',
        phoneNumber: '0000000000',
        password: process.env.DEFAULT_DEVELOPER_PASSWORD, // Using .env variable
        role: 'developer',
        category: 'youth'
      });
      console.log('Default developer account created');
    }
  } catch (error) {
    console.error('Error creating default developer:', error);
  }
};
