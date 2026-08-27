import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';
import { computeBudgetStats } from '../utils/statsAggregator.js';

export const statsController = {
  getStats: async (req, res) => {
    try {
      const stats = await computeBudgetStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  },
  

  updatePreviousYear: async (req, res) => {
    try {
      const { amount, additionalAmount, remarks } = req.body;

      const currentData = await PreviousYear.findOne().lean();
      const originalAmount = currentData ? currentData.amount : 0;
      const originalAdditionalAmount = currentData ? currentData.additionalAmount : 0;
      const originalRemarks = currentData ? currentData.remarks : '';
      const updatedAmount = Math.round(Number(amount) || 0);
      const updatedAdditionalAmount = Math.round(Number(additionalAmount) || 0);
      const updatedRemarks = remarks || '';

      await PreviousYear.findOneAndUpdate(
        {},
        {
          amount: updatedAmount,
          additionalAmount: updatedAdditionalAmount,
          remarks: updatedRemarks,
          registerId: req.user?.registerId
        },
        { upsert: true, new: true }
      );

      await logActivity(
        req,
        'UPDATE',
        'PreviousYear',
        'previous-year-amount',
        { before: { amount: originalAmount, additionalAmount: originalAdditionalAmount, remarks: originalRemarks }, after: { amount: updatedAmount, additionalAmount: updatedAdditionalAmount, remarks: updatedRemarks } },
        `Previous year amount updated by ${req.user.name}`
      );

      res.json({ message: 'Previous year amount updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update previous year amount' });
    }
  }
};
