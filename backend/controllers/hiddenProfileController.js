import HiddenProfile from '../models/HiddenProfile.js';
import { logActivity } from '../middleware/activityLogger.js';

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
        return res.status(400).json({ message: 'Valid profileId and profileType are required' });
      }

      const existingProfile = await HiddenProfile.findOne({
        profileId,
        ...(profileType === 'Income'
          ? { $or: [{ profileType: 'Income' }, { profileType: { $exists: false } }] }
          : { profileType })
      }).lean();

      if (existingProfile) {
        await logActivity(
          req,
          'UPDATE',
          'HiddenProfile',
          profileId,
          { before: { hidden: true }, after: { hidden: false } },
          `${profileType} profile ${profileId} unhidden by ${req.user.name}`
        );

        await HiddenProfile.deleteOne({ profileId });
        res.json({ message: 'Profile unhidden', hidden: false });
      } else {
        await logActivity(
          req,
          'UPDATE',
          'HiddenProfile',
          profileId,
          { before: { hidden: false }, after: { hidden: true } },
          `${profileType} profile ${profileId} hidden by ${req.user.name}`
        );

        await HiddenProfile.create({ profileId, profileType, hiddenBy: registerId });
        res.json({ message: 'Profile hidden', hidden: true });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle hidden profile' });
    }
  }
};
