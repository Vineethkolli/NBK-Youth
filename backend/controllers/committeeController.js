import Committee from '../models/Committee.js';
import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';

export const committeeController = {
  getAllMembers: async (req, res) => {
    try {
      const committees = await Committee.find().sort('order');

      // Batch fetch all users in a single query to avoid N+1 problem
      const registerIds = committees.map(c => c.registerId);
      const users = await User.find({ 
        registerId: { $in: registerIds } 
      }).lean();
      
      // Create a map for O(1) lookup
      const userMap = new Map();
      users.forEach(user => {
        userMap.set(user.registerId, user);
      });

      // Map committee data with user information
      const members = committees.map(c => {
        const user = userMap.get(c.registerId);
        if (!user) {
          return { ...c.toObject(), name: 'Unknown', profileImage: null };
        }
        return {
          _id:          c._id,
          registerId:   c.registerId,
          order:        c.order,
          addedBy:      c.addedBy,
          createdAt:    c.createdAt,
          updatedAt:    c.updatedAt,
          name:         user.name,
          profileImage: user.profileImage,
        };
      });

      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch committee members' });
    }
  },


  addMember: async (req, res) => {
    try {
      const { registerId } = req.body;
      const user = await User.findOne({ registerId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (await Committee.findOne({ registerId })) {
        return res.status(400).json({ message: 'Already in committee' });
      }

      const last = await Committee.findOne().sort('-order');
      const member = await Committee.create({
        registerId,
        order:     last ? last.order + 1 : 1,
        addedBy:   req.user.registerId
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
        name:         user.name,
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

      const originalMembers = await Committee.find();
      const originalData = originalMembers.map(m => m.toObject());

      for (const member of members) {
        await Committee.findByIdAndUpdate(member._id, { order: member.order });
      }

      await logActivity(
        req,
        'UPDATE',
        'Committee',
        'committee-order',
        { before: originalData, after: members },
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
      const user = await User.findOne({ registerId: member.registerId });
      
await logActivity(
  req,
  'DELETE',
  'Committee',
  member.registerId, 
  { before: originalData, after: null },
  `Committee member ${user?.name || 'Unknown'} (${member.registerId}) deleted by ${req.user.name}`
);

      await Committee.findByIdAndDelete(req.params.id);

      const remainingMembers = await Committee.find().sort('order');
      for (let i = 0; i < remainingMembers.length; i++) {
        remainingMembers[i].order = i + 1;
        await remainingMembers[i].save();
      }

      res.json({ message: 'Committee member removed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove committee member' });
    }
  }
};