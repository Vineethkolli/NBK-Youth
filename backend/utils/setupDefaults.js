import User from '../models/User.js';
import mongoose from 'mongoose';

export const createDefaultDeveloper = async () => {
  try {
    // Initialize counter for registerId
    const Counter = mongoose.model('Counter');
    await Counter.findByIdAndUpdate(
      'registerId',
      { $setOnInsert: { seq: 0 } },
      { upsert: true, new: true }
    );

    const existingDev = await User.findOne({ email: 'developer@gmail.com' });
    if (!existingDev) {
      await User.create({
        name: 'Default Developer',
        email: 'developer@gmail.com',
        phoneNumber: '1234567890',
        password: 'dev15',
        role: 'developer'
      });
      console.log('Default developer account created');
    }
  } catch (error) {
    console.error('Error creating default developer:', error);
  }
};