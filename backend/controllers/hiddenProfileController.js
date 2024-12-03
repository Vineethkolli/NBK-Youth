import HiddenProfile from '../models/HiddenProfile.js';

export const hiddenProfileController = {
  getHiddenProfiles: async (req, res) => {
    try {
      const hiddenProfiles = await HiddenProfile.find();
      res.json(hiddenProfiles.map(profile => profile.profileId));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch hidden profiles' });
    }
  },

  toggleHiddenProfile: async (req, res) => {
    try {
      const { profileId } = req.body;
      const registerId = req.user.registerId;

      const existingProfile = await HiddenProfile.findOne({ profileId });

      if (existingProfile) {
        await HiddenProfile.deleteOne({ profileId });
        res.json({ message: 'Profile unhidden', hidden: false });
      } else {
        await HiddenProfile.create({ profileId, hiddenBy: registerId });
        res.json({ message: 'Profile hidden', hidden: true });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle hidden profile' });
    }
  }
};