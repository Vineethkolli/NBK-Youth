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
      const [actionStats, entityStats, totalLogs, recentActivity, userActivityBreakdown] = await Promise.all([
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
        }).countDocuments(),
        
        // Get detailed user activity breakdown for specific entities
        ActivityLog.aggregate([
          {
            $match: {
              entityType: { $in: ['Income', 'Expense', 'EstimatedIncome', 'EstimatedExpense'] },
              registerId: { $exists: true, $ne: null, $ne: '' }
            }
          },
          {
            $group: {
              _id: {
                entityType: '$entityType',
                registerId: '$registerId',
                userName: '$userName',
                action: '$action'
              },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: {
                entityType: '$_id.entityType',
                registerId: '$_id.registerId',
                userName: '$_id.userName'
              },
              actions: {
                $push: {
                  action: '$_id.action',
                  count: '$count'
                }
              },
              totalActions: { $sum: '$count' }
            }
          },
          {
            $group: {
              _id: '$_id.entityType',
              users: {
                $push: {
                  registerId: '$_id.registerId',
                  userName: '$_id.userName',
                  actions: '$actions',
                  totalActions: '$totalActions'
                }
              }
            }
          },
          {
            $sort: { '_id': 1 }
          }
        ])
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

      // Convert user activity breakdown to a more usable format
      const detailedUserBreakdown = {};
      userActivityBreakdown.forEach(entityGroup => {
        const entityType = entityGroup._id;
        detailedUserBreakdown[entityType] = entityGroup.users
          .sort((a, b) => b.totalActions - a.totalActions) // Sort by total actions descending
          .map(user => ({
            registerId: user.registerId,
            userName: user.userName,
            totalActions: user.totalActions,
            actions: user.actions.reduce((acc, action) => {
              acc[action.action] = action.count;
              return acc;
            }, {})
          }));
      });
      res.json({
        totalLogs,
        recentActivity,
        actionBreakdown,
        entityBreakdown,
        detailedUserBreakdown
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch log statistics' });
    }
  },
};