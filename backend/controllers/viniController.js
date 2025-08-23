import ProcessedChunk from '../models/ProcessedChunk.js';
import ChatHistory from '../models/ChatHistory.js';
import { processCurrentData, reprocessEventData } from '../services/recordsService.js';
import { chatWithViniLogic, getCurrentStats } from '../services/viniService.js';

export const viniController = {
  // Get all processed events
  getAllProcessedEvents: async (req, res) => {
    try {
      const events = await ProcessedChunk.aggregate([
        {
          $group: {
            _id: { eventName: '$eventName', year: '$year' },
            status: { $first: '$status' },
            chunkCount: { $sum: 1 },
            createdAt: { $first: '$createdAt' },
            createdBy: { $first: '$createdBy' }
          }
        },
        {
          $project: {
            eventName: '$_id.eventName',
            year: '$_id.year',
            status: 1,
            chunkCount: 1,
            createdAt: 1,
            createdBy: 1,
            _id: 0
          }
        },
        { $sort: { year: -1, eventName: 1 } }
      ]);
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch processed events' });
    }
  },

  // Process current data into historical chunks
  processCurrentData: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      const createdBy = req.user.registerId;
      const chunkCount = await processCurrentData({ eventName, year, createdBy });
      
      res.json({ message: 'Data processed successfully', chunkCount });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ message: 'Failed to process data' });
    }
  },

  // Update processed event
  updateProcessedEvent: async (req, res) => {
    try {
      const { oldEventName, oldYear, newEventName, newYear } = req.body;
      const result = await ProcessedChunk.updateMany(
        { eventName: oldEventName, year: oldYear },
        { eventName: newEventName, year: newYear }
      );
      
      res.json({ message: 'Event updated successfully', modifiedCount: result.modifiedCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event' });
    }
  },

  // Delete processed event
  deleteProcessedEvent: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      const result = await ProcessedChunk.deleteMany({ eventName, year });
      
      res.json({ message: 'Event deleted successfully', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  },

  // Reprocess event data
  reprocessEvent: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      const createdBy = req.user.registerId;
      const chunkCount = await reprocessEventData({ eventName, year, createdBy });
      
      res.json({ message: 'Event reprocessed successfully', chunkCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reprocess event' });
    }
  },

  // Chat with VINI
  chatWithVini: async (req, res) => {
    try {
      const { message, registerId } = req.body;
      const response = await chatWithViniLogic({ message, registerId });
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: 'Failed to process chat' });
    }
  },

  // Get chat history
  getChatHistory: async (req, res) => {
    try {
      const { registerId } = req.params;
      const chatHistory = await ChatHistory.findOne({ registerId });
      
      res.json(chatHistory?.chats || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat history' });
    }
  },

  // Clear chat history
  clearChatHistory: async (req, res) => {
    try {
      const { registerId } = req.params;
      
      await ChatHistory.findOneAndUpdate(
        { registerId },
        { chats: [] },
        { upsert: true }
      );
      
      res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear chat history' });
    }
  }
};
