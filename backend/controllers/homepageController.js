import Slide from '../models/Slide.js';
import Event from '../models/Event.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

export const homepageController = {

  getSlides: async (req, res) => {
    try {
      const slides = await Slide.find().sort('order').lean();
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

      // Delete from Cloudinary
      const publicId = slide.url.split('/').pop().split('.')[0];
      const resourceType = slide.type === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(`HomepageSlides/${publicId}`, { resource_type: resourceType });

      await logActivity(
        req,
        'DELETE',
        'Slide',
        slide._id.toString(),
        { before: originalData, after: null },
        `${slide.type} slide deleted from homepage by ${req.user.name}`
      );

      await Slide.findByIdAndDelete(req.params.id);

      // Reorder remaining slides
      const remainingSlides = await Slide.find().sort('order');
      for (let i = 0; i < remainingSlides.length; i++) {
        remainingSlides[i].order = i;
        await remainingSlides[i].save();
      }

      res.json({ message: 'Slide deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete slide' });
    }
  },


  updateSlideOrder: async (req, res) => {
  try {
    const { slides } = req.body;

    const originalSlides = await Slide.find();
    const originalData = originalSlides.map(s => s.toObject());

    // Update order for each slide
    for (const slide of slides) {
      await Slide.findByIdAndUpdate(slide._id, { order: slide.order });
    }

    await logActivity(
      req,
      'UPDATE',
      'Slide',
      'slide-order',
      { before: originalData, after: slides },
      `Slide order updated by ${req.user.name}`
    );

    res.json({ message: 'Slide order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update slide order' });
  }
},


  getEvents: async (req, res) => {
    try {
      const events = await Event.find().sort('-dateTime');
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  },


  addEvent: async (req, res) => {
    try {
      const event = await Event.create({
        ...req.body,
        registerId: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'Event',
        event._id.toString(),
        { before: null, after: event.toObject() },
        `Event "${event.name}" added by ${req.user.name} for ${new Date(event.dateTime).toLocaleString()}`
      );

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add event' });
    }
  },


  deleteEvent: async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const originalData = event.toObject();

      await logActivity(
        req,
        'DELETE',
        'Event',
        event._id.toString(),
        { before: originalData, after: null },
        `Event "${event.name}" deleted by ${req.user.name}`
      );

      await Event.findByIdAndDelete(req.params.id);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  }
};
