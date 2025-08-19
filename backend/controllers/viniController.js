import { processViniQuery } from '../services/viniAiService.js';
import ChatHistory from '../models/ChatHistory.js';

export const viniController = {
  // Process chat query
  processQuery: async (req, res) => {
    try {
      const { query } = req.body;
      const userRegisterId = req.user.registerId;

      if (!query || !query.trim()) {
        return res.status(400).json({ message: 'Query is required' });
      }

      // Process the query
      const result = await processViniQuery(query.trim(), userRegisterId);

      // Save to chat history
      let chatHistory = await ChatHistory.findOne({ registerId: userRegisterId });
      
      if (!chatHistory) {
        chatHistory = await ChatHistory.create({
          registerId: userRegisterId,
          conversations: []
        });
      }

      chatHistory.conversations.push({
        userMessage: query.trim(),
        viniResponse: result.response,
        responseTime: result.responseTime,
        dataSource: result.dataSource
      });

      // Keep only last 50 conversations
      if (chatHistory.conversations.length > 50) {
        chatHistory.conversations = chatHistory.conversations.slice(-50);
      }

      await chatHistory.save();

      res.json({
        response: result.response,
        responseTime: result.responseTime,
        dataSource: result.dataSource
      });
    } catch (error) {
      console.error('VINI query error:', error);
      res.status(500).json({ message: 'Failed to process query' });
    }
  },

  // Get chat history
  getChatHistory: async (req, res) => {
    try {
      const chatHistory = await ChatHistory.findOne({ 
        registerId: req.user.registerId 
      });

      if (!chatHistory) {
        return res.json({ conversations: [] });
      }

      // Return last 20 conversations
      const recentConversations = chatHistory.conversations.slice(-20);
      res.json({ conversations: recentConversations });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat history' });
    }
  },

  // Clear chat history
  clearChatHistory: async (req, res) => {
    try {
      await ChatHistory.findOneAndUpdate(
        { registerId: req.user.registerId },
        { conversations: [] },
        { upsert: true }
      );

      res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear chat history' });
    }
  }
};
