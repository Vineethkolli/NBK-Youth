import ProcessedChunk from '../models/ProcessedChunk.js';
import ChatHistory from '../models/ChatHistory.js';
import ProcessedRecord from '../models/ProcessedRecords.js';
import Snapshot from '../models/Snapshot.js';
import { processRecordIntoChunks, buildSnapshotTextFromRecord } from '../services/processedRecordsService.js';
import { chatWithViniLogic } from '../services/viniService.js';
import { generateEmbedding } from '../services/embeddingService.js';

export const viniController = {
  // Get all processed records
  getAllProcessedRecords: async (req, res) => {
    try {
      const records = await ProcessedRecord.find()
        .populate('snapshotId')
        .sort({ year: -1, eventName: 1 });
      
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch processed records' });
    }
  },

  // Create processed record from snapshot
  createProcessedRecord: async (req, res) => {
    try {
      const { snapshotId, eventName, year, selectedCollections } = req.body;
      const createdBy = req.user.registerId;
      
      // Check for duplicate eventName + year
      const existingRecord = await ProcessedRecord.findOne({ eventName, year });
      if (existingRecord) {
        return res.status(400).json({ 
          message: `Processed record for ${eventName} ${year} already exists` 
        });
      }

      const record = await ProcessedRecord.create({
        snapshotId,
        eventName,
        year,
        selectedCollections,
        createdBy
      });

      res.status(201).json(record);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Processed record for this event and year already exists' 
        });
      }
      res.status(500).json({ message: 'Failed to create processed record' });
    }
  },

  // Process record data into chunks
  processRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id).populate('snapshotId');
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      // Update status to processing
      record.status = 'processing';
      await record.save();

  // Build snapshot text and process into chunks via processedRecordsService
  const { allText, metadata } = buildSnapshotTextFromRecord(record);
  const chunkCount = await processRecordIntoChunks(record, allText, metadata, record.createdBy);
      
      // Update record with chunk count and status
      record.chunksCount = chunkCount;
      record.status = 'ready';
      await record.save();
      
      res.json({ message: 'Data processed successfully', chunkCount });
    } catch (error) {
      console.error('Processing error:', error);
      // Update status to error
      const record = await ProcessedRecord.findById(req.params.id);
      if (record) {
        record.status = 'error';
        await record.save();
      }
      res.status(500).json({ message: 'Failed to process data' });
    }
  },

  // Reprocess record data
  reprocessRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id).populate('snapshotId');
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      // Delete existing chunks
      await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });

      // Update status to processing
      record.status = 'processing';
      record.chunksCount = 0;
      await record.save();

      // Reprocess the snapshot data
      const chunkCount = await processSnapshotData(record);
      
      // Update record
      record.chunksCount = chunkCount;
      record.status = 'ready';
      await record.save();
      
      res.json({ message: 'Data reprocessed successfully', chunkCount });
    } catch (error) {
      console.error('Reprocessing error:', error);
      res.status(500).json({ message: 'Failed to reprocess data' });
    }
  },

  // Delete processed record
  deleteProcessedRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      // Delete associated chunks
      await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });
      
      // Delete the record
      await ProcessedRecord.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Processed record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete processed record' });
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

// Helper function to process snapshot data into chunks
const processSnapshotData = async (record) => {
  const snapshot = record.snapshotId;
  let allText = '';
  let metadata = {};

  // Process selected collections
  record.selectedCollections.forEach(collectionName => {
    if (snapshot.collections[collectionName]) {
      const data = snapshot.collections[collectionName];
      
      if (collectionName === 'Income') {
        allText += "INCOME RECORDS:\n";
        data.forEach(income => {
          allText += `Income ID: ${income.incomeId}, Name: ${income.name}, Amount: ₹${income.amount}, Status: ${income.status}, Payment Mode: ${income.paymentMode}, Belongs To: ${income.belongsTo}, Date: ${income.createdAt}\n`;
        });
        metadata.incomeCount = data.length;
        metadata.totalIncome = data.reduce((sum, i) => sum + i.amount, 0);
      }
      
      if (collectionName === 'Expense') {
        allText += "\nEXPENSE RECORDS:\n";
        data.forEach(expense => {
          allText += `Expense ID: ${expense.expenseId}, Purpose: ${expense.purpose}, Amount: ₹${expense.amount}, Payment Mode: ${expense.paymentMode}, Spender: ${expense.name}, Date: ${expense.createdAt}\n`;
        });
        metadata.expenseCount = data.length;
        metadata.totalExpense = data.reduce((sum, e) => sum + e.amount, 0);
      }
      
      if (collectionName === 'EstimatedIncome') {
        allText += "\nESTIMATED INCOME RECORDS:\n";
        data.forEach(income => {
          allText += `Name: ${income.name}, Present Amount: ₹${income.presentAmount}, Status: ${income.status}, Belongs To: ${income.belongsTo}\n`;
        });
      }
      
      if (collectionName === 'EstimatedExpense') {
        allText += "\nESTIMATED EXPENSE RECORDS:\n";
        data.forEach(expense => {
          allText += `Purpose: ${expense.purpose}, Present Amount: ₹${expense.presentAmount}\n`;
        });
      }
    }
    
    if (collectionName === 'Stats' && snapshot.stats) {
      allText += "\nSTATISTICS:\n";
      allText += `Total Income: ₹${snapshot.stats.budgetStats?.totalIncome?.amount || 0}\n`;
      allText += `Amount Received: ₹${snapshot.stats.budgetStats?.amountReceived?.amount || 0}\n`;
      allText += `Total Expenses: ₹${snapshot.stats.budgetStats?.totalExpenses?.amount || 0}\n`;
      allText += `Amount Left: ₹${snapshot.stats.budgetStats?.amountLeft?.amount || 0}\n`;
    }
  });

  // Split into chunks and create ProcessedChunk documents
  const chunks = splitIntoChunks(allText);
  const processedChunks = [];

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      
      const processedChunk = new ProcessedChunk({
        eventName: record.eventName,
        year: record.year,
        chunkText: chunk,
        embedding,
        metadata,
        status: 'ready',
        createdBy: record.createdBy
      });
      
      processedChunks.push(processedChunk);
    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  }
  
  if (processedChunks.length > 0) {
    await ProcessedChunk.insertMany(processedChunks);
  }
  
  return processedChunks.length;
};

// Helper function to split text into chunks
const splitIntoChunks = (text, maxTokens = 500) => {
  const sentences = text.split(/[.!?]\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length > maxTokens) {
      for (let i = 0; i < words.length; i += maxTokens) {
        chunks.push(words.slice(i, i + maxTokens).join(' '));
      }
    } else if ((currentChunk + sentence).split(' ').length > maxTokens) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.filter(chunk => chunk.length > 0);
};