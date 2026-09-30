import Slide from '../models/Slide.js';
import EventTimeline from '../models/EventTimeline.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';
import { redis } from '../utils/redis.js';

export const homepageController = {
  getSlides: async (req, res) => {
    try {
      const cached = await redis.get('home:slides');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const slides = await Slide.find().sort('order').lean();

      redis.set('home:slides', JSON.stringify(slides));

      res.json(slides);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch slides' });
    }
  },


  addSlide: async (req, res) => {
    try {
      const { type, url, mediaPublicId } = req.body;

      const maxOrder = await Slide.findOne().sort('-order').lean();
      const order = maxOrder ? maxOrder.order + 1 : 0;

      if (!url || !mediaPublicId) {
        return res.status(400).json({ message: 'Missing slide media details' });
      }

      const slide = await Slide.create({
        url,
        mediaPublicId,
        type,
        order,
        createdBy: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'Slide',
        slide._id.toString(),
        { before: null, after: slide.toObject() },
        `${type} slide added to homepage by ${req.user.name}`
      );

      redis.del('home:slides');
      res.status(201).json(slide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add slide' });
    }
  },


  deleteSlide: async (req, res) => {
    try {
      const slide = await Slide.findById(req.params.id);
      if (!slide) {
        return res.status(404).json({ message: 'Slide not found' });
      }

      const originalData = slide.toObject();

      const publicId = slide.url.split('/').pop().split('.')[0];
      const resourceType = slide.type === 'video' ? 'video' : 'image';

      await cloudinary.uploader.destroy(`HomepageSlides/${publicId}`, {
        resource_type: resourceType
      });

      await logActivity(
        req,
        'DELETE',
        'Slide',
        slide._id.toString(),
        { before: originalData, after: null },
        `${slide.type} slide deleted from homepage by ${req.user.name}`
      );

      await Slide.findByIdAndDelete(req.params.id);

      const remainingSlides = await Slide.find().sort('order').lean();
      if (remainingSlides.length > 0) {
        const bulkOps = remainingSlides.map((s, index) => ({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { order: index } }
          }
        }));
        await Slide.bulkWrite(bulkOps);
      }

      redis.del('home:slides');
      res.json({ message: 'Slide deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete slide' });
    }
  },


  updateSlideOrder: async (req, res) => {
    try {
      const { slides } = req.body;

      const originalSlides = await Slide.find().lean();

      const bulkOps = slides.map(slide => ({
        updateOne: {
          filter: { _id: slide._id },
          update: { $set: { order: slide.order } }
        }
      }));

      await Slide.bulkWrite(bulkOps);

      await logActivity(
        req,
        'UPDATE',
        'Slide',
        'slide-order',
        { before: originalSlides, after: slides },
        `Slide order updated by ${req.user.name}`
      );

      redis.del('home:slides');
      res.json({ message: 'Slide order updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update slide order' });
    }
  },


  getEventTimeline: async (req, res) => {
    try {
      const cached = await redis.get('home:event-timeline');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const eventTimeline = await EventTimeline.find().sort('-dateTime').lean();

      redis.set('home:event-timeline', JSON.stringify(eventTimeline));

      res.json(eventTimeline);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch Event Timeline' });
    }
  },


  addEventTimeline: async (req, res) => {
    try {
      const eventTimeline = await EventTimeline.create({
        ...req.body,
        registerId: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'EventTimeline',
        eventTimeline._id.toString(),
        { before: null, after: eventTimeline.toObject() },
        `Event Timeline entry "${eventTimeline.name}" added by ${req.user.name} for ${new Date(eventTimeline.dateTime).toLocaleString()}`
      );

      redis.del('home:event-timeline');
      res.status(201).json(eventTimeline);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Event Timeline entry' });
    }
  },


  deleteEventTimeline: async (req, res) => {
    try {
      const eventTimeline = await EventTimeline.findById(req.params.id);
      if (!eventTimeline) {
        return res.status(404).json({ message: 'Event Timeline entry not found' });
      }

      const originalData = eventTimeline.toObject();

      await logActivity(
        req,
        'DELETE',
        'EventTimeline',
        eventTimeline._id.toString(),
        { before: originalData, after: null },
        `Event Timeline entry "${eventTimeline.name}" deleted by ${req.user.name}`
      );

      await EventTimeline.findByIdAndDelete(req.params.id);

      redis.del('home:event-timeline');
      res.json({ message: 'Event Timeline entry deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete Event Timeline entry' });
    }
  },

  updateEventTimeline: async (req, res) => {
    try {
      const eventTimeline = await EventTimeline.findById(req.params.id);
      if (!eventTimeline) {
        return res.status(404).json({ message: 'Event Timeline entry not found' });
      }

      const originalData = eventTimeline.toObject();

      const { name, dateTime } = req.body;
      if (name) eventTimeline.name = name;
      if (dateTime) eventTimeline.dateTime = dateTime;

      await eventTimeline.save();

      await logActivity(
        req,
        'UPDATE',
        'EventTimeline',
        eventTimeline._id.toString(),
        { before: originalData, after: eventTimeline.toObject() },
        `Event Timeline entry "${eventTimeline.name}" updated by ${req.user.name}`
      );

      redis.del('home:event-timeline');
      res.json(eventTimeline);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update Event Timeline entry' });
    }
  }
};
