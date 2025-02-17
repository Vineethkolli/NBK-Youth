import WebpageStatus from '../models/WebpageStatus.js';

export const webpageController = {
  // Get all webpage statuses
  getWebpages: async (req, res) => {
    try {
      const webpages = await WebpageStatus.find().sort('name');
      res.json(webpages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch webpage statuses' });
    }
  },

  // Update webpage status
  updateWebpage: async (req, res) => {
    try {
      const { path, isEnabled } = req.body;
      const webpage = await WebpageStatus.findOneAndUpdate(
        { path },
        { isEnabled, updatedBy: req.user.registerId },
        { new: true }
      );
      res.json(webpage);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update webpage status' });
    }
  },

  // Initialize default webpages
  initializeWebpages: async (registerId) => {
    const defaultPages = [
      { path: '/maintenance', name: 'Maintenance Page', isEnabled: false },
      { path: '/stats', name: 'Statistics', isEnabled: true },
      { path: '/income', name: 'Income Management', isEnabled: true },
      { path: '/expense', name: 'Expense Management', isEnabled: true },
      { path: '/estimation', name: 'Estimation', isEnabled: true },
      { path: '/verification', name: 'Verification', isEnabled: true },
      { path: '/recycle-bin', name: 'Recycle Bin', isEnabled: true },
      { path: '/vibe', name: 'Vibe', isEnabled: true },
      { path: '/moments', name: 'Moments', isEnabled: true },
      { path: '/lets-play', name: "Let's Play", isEnabled: true },
      { path: '/notifications', name: 'Notifications', isEnabled: true }
    ];

    try {
      for (const page of defaultPages) {
        await WebpageStatus.findOneAndUpdate(
          { path: page.path },
          { ...page, updatedBy: registerId },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error('Failed to initialize webpages:', error);
    }
  }
};