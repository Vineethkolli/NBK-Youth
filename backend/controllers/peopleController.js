import People from '../models/People.js';
import { logActivity } from '../middleware/activityLogger.js';

export const peopleController = {
  getPeople: async (req, res) => {
    try {
      const { search = '', category, street } = req.query;
      const query = {};
      if (category) query.category = category;
      if (street) query.street = street;
      if (search) {
        query.$or = [
          { pid: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      res.json(await People.find(query).sort({ createdAt: -1 }).lean());
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch people', error: error.message });
    }
  },

  createPerson: async (req, res) => {
    try {
      const person = await People.create(req.body);
      await logActivity(req, 'CREATE', 'People', person.pid, { before: null, after: person.toObject() }, `People ${person.pid} created by ${req.user?.name}`);
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create person', error: error.message });
    }
  },

  updatePerson: async (req, res) => {
    try {
      const person = await People.findById(req.params.id);
      if (!person) return res.status(404).json({ message: 'People record not found' });
      const before = person.toObject();
      Object.assign(person, req.body);
      const updated = await person.save();
      await logActivity(req, 'UPDATE', 'People', updated.pid, { before, after: updated.toObject() }, `People ${updated.pid} updated by ${req.user?.name}`);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update person', error: error.message });
    }
  },

  deletePerson: async (req, res) => {
    try {
      const person = await People.findById(req.params.id);
      if (!person) return res.status(404).json({ message: 'People record not found' });
      const before = person.toObject();
      await People.deleteOne({ _id: req.params.id });
      await logActivity(req, 'DELETE', 'People', person.pid, { before, after: null }, `People ${person.pid} permanently deleted by ${req.user?.name}`);
      res.json({ message: 'People record deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete person', error: error.message });
    }
  }
};
