import AuthLog from '../models/AuthLog.js';

export const authLogController = {
  getAll: async (req, res) => {
    try {
      const { search, page = 1, limit = 50, latest } = req.query;
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

      // If latest=true, get only the latest log per user
      if (latest === 'true') {
        const pipeline = [
          { $match: query },
          { $sort: { registerId: 1, createdAt: -1 } },
          {
            $group: {
              _id: '$registerId',
              latestLog: { $first: '$$ROOT' }
            }
          },
          { $replaceRoot: { newRoot: '$latestLog' } },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) }
        ];

        const logs = await AuthLog.aggregate(pipeline);

        const total = await AuthLog.distinct('registerId', query).then(ids => ids.length);

        return res.json({
          logs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalCount: total
          }
        });
      }

      const [logs, total] = await Promise.all([
        AuthLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
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
