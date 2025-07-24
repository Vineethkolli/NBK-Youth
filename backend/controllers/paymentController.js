import Payment from '../models/Payment.js';
import Income from '../models/Income.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

const PaymentController = {
  // Fetch all payments (or only payments for a specific user)
  async getAllPayments(req, res) {
    try {
      const { registerId } = req.query;
      let payments;

      if (registerId) {
        payments = await Payment.find({ registerId }).sort({ createdAt: -1 });
      } else {
        payments = await Payment.find().sort({ createdAt: -1 });
      }

      return res.status(200).json(payments);
    } catch (err) {
      return res.status(500).json({ message: 'Error fetching payments', error: err.message });
    }
  },

  // Fetch a single payment by paymentId
  async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      return res.status(200).json(payment);
    } catch (err) {
      return res.status(500).json({ message: 'Error fetching payment', error: err.message });
    }
  },

  // Create a new payment
  async createPayment(req, res) {
    try {
      const { paymentId, registerId, name, email, phoneNumber, amount, belongsTo, screenshot } = req.body;
    
      const screenshotUrl = await uploadToCloudinary(screenshot, 'PaymentScreenshots');
    
      const newPayment = new Payment({
        paymentId,
        registerId,
        name,
        email,
        phoneNumber,
        amount,
        belongsTo,
        screenshot: screenshotUrl,
        transactionStatus: 'pending',
        verifyLog: 'not verified'
      });

      await newPayment.save();

      // Log payment creation
      await logActivity(
        { user: { registerId, name }, ip: req.ip, get: req.get.bind(req) },
        'CREATE',
        'Payment',
        newPayment.paymentId,
        { before: null, after: newPayment.toObject() },
        `Payment ${newPayment.paymentId} created by ${name} - Amount: ₹${amount}`
      );

      return res.status(201).json(newPayment);
    } catch (err) {
      return res.status(500).json({ message: 'Error creating payment', error: err.message });
    }
  },

  // Get verification data
  async getVerificationData(req, res) {
    try {
      const { verifyLog } = req.query;
      const payments = await Payment.find({ verifyLog }).sort({ createdAt: -1 });
      return res.json(payments);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch verification data', error: error.message });
    }
  },

  // Update payment details
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { name, belongsTo } = req.body;

      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Check if name exists in Income collection
      const existingIncome = await Income.findOne({ name });
      if (existingIncome) {
        return res.status(400).json({ 
          message: 'Name already exists in income records',
          existingName: existingIncome.name 
        });
      }

      const originalData = payment.toObject();

      payment.name = name;
      payment.belongsTo = belongsTo;
      await payment.save();

      // Log payment update
      await logActivity(
        req,
        'UPDATE',
        'Payment',
        payment.paymentId,
        { before: originalData, after: payment.toObject() },
        `Payment ${payment.paymentId} details updated - Name: ${name}, Belongs to: ${belongsTo}`
      );

      return res.json({ message: 'Payment updated successfully', payment });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update payment', error: error.message });
    }
  },

  // Update verification status
  async updateVerificationStatus(req, res) {
    try {
      const { id } = req.params;
      const { verifyLog, registerId } = req.body;

      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      const originalData = payment.toObject();

      // If verifying payment, check for existing name in Income
      if (verifyLog === 'verified') {
        const existingIncome = await Income.findOne({ name: payment.name });
        if (existingIncome) {
          return res.status(400).json({ 
            message: 'Name already exists in income records',
            existingName: existingIncome.name 
          });
        }

        // Create new income entry
        const newIncome = new Income({
          registerId: payment.registerId,
          name: payment.name,
          email: payment.email,
          phoneNumber: payment.phoneNumber,
          amount: payment.amount,
          status: 'paid',
          paymentMode: 'web app',
          belongsTo: payment.belongsTo,
          verifyLog: 'verified'
        });

        await newIncome.save();
        payment.transactionStatus = 'successful';
      } else if (verifyLog === 'rejected') {
        payment.transactionStatus = 'failed';
      }

      // Update verification status
      payment.verifyLog = verifyLog;
      payment.verifiedBy = registerId;
      payment.verifiedAt = new Date();

      await payment.save();
      return res.json({ message: 'Verification status updated successfully' });
      // Log verification status change
      await logActivity(
        req,
        'VERIFY',
        'Payment',
        payment.paymentId,
        { before: originalData, after: payment.toObject() },
        `Payment ${payment.paymentId} verification status changed to ${verifyLog} by ${registerId}`
      );

    } catch (error) {
      return res.status(500).json({ message: 'Failed to update verification status', error: error.message });
    }
  },
  
  // Delete payment by paymentId
  async deletePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      await payment.remove();
      return res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Error deleting payment', error: err.message });
    }
  }
};

export default PaymentController;