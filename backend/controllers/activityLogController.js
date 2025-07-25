import ActivityLog from '../models/ActivityLog.js';

export const activityLogController = {
  // Get all activity logs with filters
  getAllLogs: async (req, res) => {
    try {
      const { 
        search, 
        action, 
        entityType, 
        registerId, 
        startDate, 
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      let query = {};

      // Search functionality
      if (search) {
        query.$or = [
          { registerId: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { entityId: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by action
      if (action) {
        query.action = action;
      }

      // Filter by entity type
      if (entityType) {
        query.entityType = entityType;
      }

      // Filter by register ID
      if (registerId) {
        query.registerId = registerId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [logs, totalCount] = await Promise.all([
        ActivityLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        ActivityLog.countDocuments(query)
      ]);

      res.json({
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + logs.length < totalCount,
          hasPrev: parseInt(page) > 1
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  },

  // Get activity statistics
  getLogStats: async (req, res) => {
    try {
      const [actionStats, entityStats, totalLogs, recentActivity] = await Promise.all([
        // Get action breakdown
        ActivityLog.aggregate([
          {
            $group: {
              _id: '$action',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Get entity breakdown
        ActivityLog.aggregate([
          {
            $group: {
              _id: '$entityType',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Get total logs count
        ActivityLog.countDocuments(),
        
        // Get recent activity (last 24 hours)
        ActivityLog.find({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).countDocuments()
      ]);

      // Convert arrays to objects
      const actionBreakdown = {};
      actionStats.forEach(stat => {
        actionBreakdown[stat._id] = stat.count;
      });

      const entityBreakdown = {};
      entityStats.forEach(stat => {
        entityBreakdown[stat._id] = stat.count;
      });

      res.json({
        totalLogs,
        recentActivity,
        actionBreakdown,
        entityBreakdown
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch log statistics' });
    }
  },
};