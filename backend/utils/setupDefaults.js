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

    const existingDev = await User.findOne({ email: 'devvineel@gmail.com' });
    if (!existingDev) {
      await User.create({
        name: 'Dev Vineel',
        email: 'devvineel@gmail.com',
        phoneNumber: '0000000000',
        password: 'DevVineel@15',
        role: 'developer'
      });
      console.log('Default developer account created');
    }
  } catch (error) {
    console.error('Error creating default developer:', error);
  }
};