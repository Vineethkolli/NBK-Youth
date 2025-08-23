import ChatHistory from '../models/ChatHistory.js';
import { chatWithViniLogic, getCurrentStats } from '../services/viniService.js';

export const viniController = {
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
