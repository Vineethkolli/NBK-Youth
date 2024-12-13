import Slide from '../models/Slide.js';
import Event from '../models/Event.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';

export const homepageController = {
  // Slide Controllers
  getSlides: async (req, res) => {
    try {
      const slides = await Slide.find().sort('order');
      res.json(slides);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch slides' });
    }
  },

  addSlide: async (req, res) => {
    try {
      const { file, type } = req.body;
      const maxOrder = await Slide.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;

      // Upload to Cloudinary
      const url = await uploadToCloudinary(file, 'HomepageSlides');

      const slide = await Slide.create({
        url,
        type,
        order,
        createdBy: req.user.registerId
      });

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

      // Delete from Cloudinary
      const publicId = slide.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`HomepageSlides/${publicId}`);

      // Delete from database
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
      
      for (const slide of slides) {
        await Slide.findByIdAndUpdate(slide._id, { order: slide.order });
      }

      res.json({ message: 'Slide order updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update slide order' });
    }
  },

  // Event Controllers
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
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add event' });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      await Event.findByIdAndDelete(req.params.id);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  }
};