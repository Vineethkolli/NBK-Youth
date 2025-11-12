// Command: node scripts/addIndexes.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import AuthLog from '../models/AuthLog.js';

dotenv.config();

const addIndexes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Adding indexes to collections...\n');

    // User indexes
    console.log('👤 Adding User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
    await User.collection.createIndex({ registerId: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1, category: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created\n');

    // Income indexes
    console.log('💰 Adding Income indexes...');
    await Income.collection.createIndex({ registerId: 1 });
    await Income.collection.createIndex({ incomeId: 1 }, { unique: true });
    await Income.collection.createIndex({ name: 1 }, { unique: true });
    await Income.collection.createIndex({ status: 1 });
    await Income.collection.createIndex({ paymentMode: 1 });
    await Income.collection.createIndex({ belongsTo: 1 });
    await Income.collection.createIndex({ verifyLog: 1 });
    await Income.collection.createIndex({ isDeleted: 1, createdAt: -1 });
    await Income.collection.createIndex({ belongsTo: 1, status: 1 });
    await Income.collection.createIndex({ status: 1, paymentMode: 1 });
    await Income.collection.createIndex({ paidDate: 1 });
    console.log('✅ Income indexes created\n');

    // Expense indexes
    console.log('💸 Adding Expense indexes...');
    await Expense.collection.createIndex({ registerId: 1 });
    await Expense.collection.createIndex({ expenseId: 1 }, { unique: true });
    await Expense.collection.createIndex({ paymentMode: 1 });
    await Expense.collection.createIndex({ verifyLog: 1 });
    await Expense.collection.createIndex({ isDeleted: 1, createdAt: -1 });
    await Expense.collection.createIndex({ createdAt: -1 });
    console.log('✅ Expense indexes created\n');

    // Payment indexes
    console.log('💳 Adding Payment indexes...');
    await Payment.collection.createIndex({ paymentId: 1 }, { unique: true });
    await Payment.collection.createIndex({ registerId: 1 });
    await Payment.collection.createIndex({ transactionStatus: 1 });
    await Payment.collection.createIndex({ verifyLog: 1 });
    await Payment.collection.createIndex({ verifyLog: 1, createdAt: -1 });
    await Payment.collection.createIndex({ createdAt: -1 });
    console.log('✅ Payment indexes created\n');

    // Notification indexes
    console.log('🔔 Adding Notification indexes...');
    await Notification.collection.createIndex({ registerId: 1 }, { unique: true });
    console.log('✅ Notification indexes created\n');

    // ActivityLog indexes
    console.log('📝 Adding ActivityLog indexes...');
    await ActivityLog.collection.createIndex({ timestamp: -1 });
    await ActivityLog.collection.createIndex({ action: 1 });
    await ActivityLog.collection.createIndex({ entityType: 1 });
    await ActivityLog.collection.createIndex({ performedBy: 1 });
    await ActivityLog.collection.createIndex({ action: 1, entityType: 1 });
    console.log('✅ ActivityLog indexes created\n');

    // AuthLog indexes
    console.log('🔐 Adding AuthLog indexes...');
    await AuthLog.collection.createIndex({ timestamp: -1 });
    await AuthLog.collection.createIndex({ event: 1 });
    await AuthLog.collection.createIndex({ registerId: 1 });
    await AuthLog.collection.createIndex({ success: 1 });
    console.log('✅ AuthLog indexes created\n');

    console.log('🎉 All indexes created successfully!');
    console.log('\n📊 Verifying indexes...\n');

    // Verify indexes
    const userIndexes = await User.collection.indexes();
    console.log(`User indexes: ${userIndexes.length}`);

    const incomeIndexes = await Income.collection.indexes();
    console.log(`Income indexes: ${incomeIndexes.length}`);

    const expenseIndexes = await Expense.collection.indexes();
    console.log(`Expense indexes: ${expenseIndexes.length}`);

    const paymentIndexes = await Payment.collection.indexes();
    console.log(`Payment indexes: ${paymentIndexes.length}`);

    console.log('\n Indexing complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
};

addIndexes();
