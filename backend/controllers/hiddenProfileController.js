import HiddenProfile from '../models/HiddenProfile.js';
import { logActivity } from '../middleware/activityLogger.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';

export const hiddenProfileController = {
  getHiddenProfiles: async (req, res) => {
    try {
      const hiddenProfiles = await HiddenProfile.find().lean();
      res.json(hiddenProfiles.map(profile => ({
        profileId: profile.profileId,
        profileType: profile.profileType || 'Income'
      })));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch hidden profiles' });
    }
  },


  toggleHiddenProfile: async (req, res) => {
    try {
      const { profileId, profileType = 'Income' } = req.body;
      const registerId = req.user.registerId;

      if (!profileId || !['Income', 'Expense'].includes(profileType)) {
        return res.status(400).json({
          message: 'Valid profileId and profileType are required'
        });
      }

      const record = profileType === 'Income'
        ? await Income.findById(profileId).select('incomeId').lean()
        : await Expense.findById(profileId).select('expenseId').lean();

      if (!record) {
        return res.status(404).json({
          message: `${profileType} record not found`
        });
      }

      const recordId = profileType === 'Income'
        ? record.incomeId
        : record.expenseId;

      if (!recordId) {
        return res.status(400).json({
          message: `${profileType} Record ID not found`
        });
      }

      const existingProfile = await HiddenProfile.findOne({
        profileId,
        ...(profileType === 'Income'
          ? {
              $or: [
                { profileType: 'Income' },
                { profileType: { $exists: false } }
              ]
            }
          : { profileType })
      }).lean();

      if (existingProfile) {
        await logActivity(
          req,
          'UPDATE',
          'HiddenProfile',
          recordId,
          { before: { hidden: true }, after: { hidden: false } },
          `${profileType} record ${recordId} unhidden by ${req.user.name}`
        );

        await HiddenProfile.deleteOne({ _id: existingProfile._id });

        return res.json({
          message: 'Profile unhidden',
          hidden: false
        });
      }

      await logActivity(
        req,
        'UPDATE',
        'HiddenProfile',
        recordId,
        { before: { hidden: false }, after: { hidden: true } },
        `${profileType} record ${recordId} hidden by ${req.user.name}`
      );

      await HiddenProfile.create({
        profileId,
        profileType,
        hiddenBy: registerId
      });

      return res.json({
        message: 'Profile hidden',
        hidden: true
      });
    } catch (error) {
      console.error('Failed to toggle hidden profile:', error);

      res.status(500).json({
        message: 'Failed to toggle hidden profile'
      });
    }
  }
};
