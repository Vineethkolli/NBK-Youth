import AuthLog from '../models/AuthLog.js';

export const authLogController = {
  getAll: async (req, res) => {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { registerId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } },
          { 'deviceInfo.platform': { $regex: search, $options: 'i' } },
          { 'deviceInfo.browser.name': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuthLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        AuthLog.countDocuments(query)
      ]);

      res.json({
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCount: total
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch auth logs' });
    }
  }
};
