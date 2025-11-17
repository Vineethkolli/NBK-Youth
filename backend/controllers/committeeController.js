import Committee from '../models/Committee.js';
import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';

export const committeeController = {
  getAllMembers: async (req, res) => {
    try {
      const members = await Committee.aggregate([
        { $sort: { order: 1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'registerId',
            foreignField: 'registerId',
            as: 'userInfo'
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            registerId: 1,
            order: 1,
            addedBy: 1,
            createdAt: 1,
            updatedAt: 1,
            name: { $ifNull: ['$userInfo.name', 'Unknown'] },
            profileImage: { $ifNull: ['$userInfo.profileImage', null] }
          }
        }
      ]);

      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch committee members' });
    }
  },


  addMember: async (req, res) => {
    try {
      const { registerId } = req.body;

      const [user, existingMember, last] = await Promise.all([
        User.findOne({ registerId }).select('registerId name profileImage').lean(),
        Committee.findOne({ registerId }).lean(),
        Committee.findOne().sort('-order').select('order').lean()
      ]);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (existingMember) {
        return res.status(400).json({ message: 'Already in committee' });
      }

      const member = await Committee.create({
        registerId,
        order: last ? last.order + 1 : 1,
        addedBy: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'Committee',
        user.registerId,
        { before: null, after: member.toObject() },
        `Added ${user.name || 'Unknown'} (${registerId}) to committee by ${req.user.name}`
      );

      res.status(201).json({
        ...member.toObject(),
        name: user.name,
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add committee member' });
    }
  },


  updateOrder: async (req, res) => {
    try {
      const { members } = req.body;

      const originalMembers = await Committee.find().lean();

      const bulkOps = members.map(member => ({
        updateOne: {
          filter: { _id: member._id },
          update: { $set: { order: member.order } }
        }
      }));

      await Committee.bulkWrite(bulkOps);

      await logActivity(
        req,
        'UPDATE',
        'Committee',
        'committee-order',
        { before: originalMembers, after: members },
        `Committee member order updated by ${req.user.name}`
      );

      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update order' });
    }
  },


  removeMember: async (req, res) => {
    try {
      const member = await Committee.findById(req.params.id);
      if (!member) {
        return res.status(404).json({ message: 'Committee member not found' });
      }

      const originalData = member.toObject();
      const user = await User.findOne({ registerId: member.registerId }).select('name').lean();

      await logActivity(
        req,
        'DELETE',
        'Committee',
        member.registerId,
        { before: originalData, after: null },
        `Committee member ${user?.name || 'Unknown'} (${member.registerId}) deleted by ${req.user.name}`
      );

      await Committee.findByIdAndDelete(req.params.id);

      const remainingMembers = await Committee.find().sort('order').lean();

      if (remainingMembers.length > 0) {
        const bulkOps = remainingMembers.map((m, index) => ({
          updateOne: {
            filter: { _id: m._id },
            update: { $set: { order: index + 1 } }
          }
        }));
        await Committee.bulkWrite(bulkOps);
      }

      res.json({ message: 'Committee member removed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove committee member' });
    }
  }
};
