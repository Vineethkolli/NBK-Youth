import PaymentDetails from '../models/PaymentDetails.js';
import { logActivity } from '../middleware/activityLogger.js';

export const paymentDetailsController = {
  // Get payment details
  getPaymentDetails: async (req, res) => {
    try {
      let details = await PaymentDetails.findOne();
      
      // If no details exist, create default
      if (!details) {
        details = await PaymentDetails.create({
          upiNumber: '0000000000',
          upiId: 'xxxxxxxxxx@xxx',
          accountHolder: 'NBK Youth'
        });
      }
      
      res.json(details);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payment details' });
    }
  },

  // Update payment details
  updatePaymentDetails: async (req, res) => {
    try {
      const { upiNumber, upiId, accountHolder } = req.body;

      let details = await PaymentDetails.findOne();
      const originalData = details ? details.toObject() : null;
      
      if (details) {
        details.upiNumber = upiNumber;
        details.upiId = upiId;
        details.accountHolder = accountHolder;
        await details.save();
      } else {
        details = await PaymentDetails.create({
          upiNumber,
          upiId,
          accountHolder
        });
      }

      // Log payment details update
      await logActivity(
        req,
        originalData ? 'UPDATE' : 'CREATE',
        'PaymentDetails',
        'payment-details',
        { before: originalData, after: details.toObject() },
        `Payment details ${originalData ? 'updated' : 'created'} by ${req.user.name}`
      );
      res.json(details);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update payment details' });
    }
  }
};