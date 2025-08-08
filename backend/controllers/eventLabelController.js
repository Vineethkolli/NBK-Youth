import EventLabel from '../models/EventLabel.js';
import { logActivity } from '../middleware/activityLogger.js';

export const eventLabelController = {
  // Get current event label
  getEventLabel: async (req, res) => {
    try {
      const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
      res.json(eventLabel);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event label' });
    }
  },

  // Create event label
  createEventLabel: async (req, res) => {
    try {
      const { label } = req.body;

      // Delete any existing event label (only one at a time)
      await EventLabel.deleteMany({});

      const eventLabel = await EventLabel.create({
        label,
        createdBy: req.user.registerId
      });

      // Log event label creation
      await logActivity(
        req,
        'CREATE',
        'EventLabel',
        eventLabel._id.toString(),
        { before: null, after: eventLabel.toObject() },
        `Event label "${label}" created by ${req.user.name}`
      );

      res.status(201).json(eventLabel);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create event label' });
    }
  },

  // Update event label
  updateEventLabel: async (req, res) => {
    try {
      const { label } = req.body;
      const originalEventLabel = await EventLabel.findById(req.params.id);
      
      if (!originalEventLabel) {
        return res.status(404).json({ message: 'Event label not found' });
      }

      const originalData = originalEventLabel.toObject();

      const eventLabel = await EventLabel.findByIdAndUpdate(
        req.params.id,
        { label },
        { new: true }
      );

      // Log event label update
      await logActivity(
        req,
        'UPDATE',
        'EventLabel',
        eventLabel._id.toString(),
        { before: originalData, after: eventLabel.toObject() },
        `Event label updated to "${label}" by ${req.user.name}`
      );

      res.json(eventLabel);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event label' });
    }
  },

  // Delete event label
  deleteEventLabel: async (req, res) => {
    try {
      const eventLabel = await EventLabel.findById(req.params.id);
      
      if (!eventLabel) {
        return res.status(404).json({ message: 'Event label not found' });
      }

      const originalData = eventLabel.toObject();

      // Log event label deletion
      await logActivity(
        req,
        'DELETE',
        'EventLabel',
        eventLabel._id.toString(),
        { before: originalData, after: null },
        `Event label "${eventLabel.label}" deleted by ${req.user.name}`
      );

      await EventLabel.findByIdAndDelete(req.params.id);
      res.json({ message: 'Event label deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event label' });
    }
  }
};