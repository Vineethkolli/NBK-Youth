import ProcessedRecord from '../models/ProcessedRecord.js';
import Snapshot from '../models/Snapshot.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { logActivity } from '../middleware/activityLogger.js';

export const processedRecordController = {
  // Get all processed records
  getAllProcessedRecords: async (req, res) => {
    try {
      const records = await ProcessedRecord.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch processed records' });
    }
  },

  // Create processed record
  createProcessedRecord: async (req, res) => {
    try {
      const { snapshotId, selectedCollections } = req.body;

      // Get snapshot data
      const snapshot = await Snapshot.findOne({ snapshotId });
      if (!snapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      const record = await ProcessedRecord.create({
        snapshotId,
        eventName: snapshot.eventName,
        year: snapshot.year,
        selectedCollections,
        addedBy: req.user.registerId
      });

      // Log processed record creation
      await logActivity(
        req,
        'CREATE',
        'ProcessedRecord',
        record._id.toString(),
        { before: null, after: record.toObject() },
        `Processed record created for ${snapshot.eventName} ${snapshot.year} by ${req.user.name}`
      );

      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create processed record' });
    }
  },

  // Update processed record
  updateProcessedRecord: async (req, res) => {
    try {
      const originalRecord = await ProcessedRecord.findById(req.params.id);
      if (!originalRecord) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      const originalData = originalRecord.toObject();

      const record = await ProcessedRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      // Log processed record update
      await logActivity(
        req,
        'UPDATE',
        'ProcessedRecord',
        record._id.toString(),
        { before: originalData, after: record.toObject() },
        `Processed record updated by ${req.user.name}`
      );

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update processed record' });
    }
  },

  // Delete processed record
  deleteProcessedRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      const originalData = record.toObject();

      // Delete associated chunks
      await ProcessedChunk.deleteMany({ 
        eventName: record.eventName, 
        year: record.year 
      });

      // Log processed record deletion
      await logActivity(
        req,
        'DELETE',
        'ProcessedRecord',
        record._id.toString(),
        { before: originalData, after: null },
        `Processed record for ${record.eventName} ${record.year} deleted by ${req.user.name}`
      );

      await ProcessedRecord.findByIdAndDelete(req.params.id);
      res.json({ message: 'Processed record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete processed record' });
    }
  },

  // Process/Reprocess record
  processRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      // Update status to processing
      record.status = 'processing';
      await record.save();

      // Delete existing chunks for this event/year
      await ProcessedChunk.deleteMany({ 
        eventName: record.eventName, 
        year: record.year 
      });

      // Get snapshot data
      const snapshot = await Snapshot.findOne({ snapshotId: record.snapshotId });
      if (!snapshot) {
        record.status = 'error';
        await record.save();
        return res.status(404).json({ message: 'Associated snapshot not found' });
      }

      // Process selected collections
      let processedText = '';
      
      record.selectedCollections.forEach(collectionName => {
        if (snapshot.collections[collectionName]) {
          processedText += `\n${collectionName.toUpperCase()} RECORDS:\n`;
          
          if (collectionName === 'Income') {
            snapshot.collections[collectionName].forEach(item => {
              processedText += `Income ID: ${item.incomeId}, Name: ${item.name}, Amount: ₹${item.amount}, Status: ${item.status}, Payment Mode: ${item.paymentMode}, Belongs To: ${item.belongsTo}, Date: ${item.createdAt}\n`;
            });
          } else if (collectionName === 'Expense') {
            snapshot.collections[collectionName].forEach(item => {
              processedText += `Expense ID: ${item.expenseId}, Purpose: ${item.purpose}, Amount: ₹${item.amount}, Payment Mode: ${item.paymentMode}, Spender: ${item.name}, Date: ${item.createdAt}\n`;
            });
          } else if (collectionName === 'EstimatedIncome') {
            snapshot.collections[collectionName].forEach(item => {
              processedText += `Estimated Income ID: ${item.EIID}, Name: ${item.name}, Present Amount: ₹${item.presentAmount}, Status: ${item.status}, Belongs To: ${item.belongsTo}\n`;
            });
          } else if (collectionName === 'EstimatedExpense') {
            snapshot.collections[collectionName].forEach(item => {
              processedText += `Estimated Expense ID: ${item.EEID}, Purpose: ${item.purpose}, Present Amount: ₹${item.presentAmount}\n`;
            });
          }
        }
      });

      if (record.selectedCollections.includes('Stats') && snapshot.stats) {
        processedText += `\nSTATISTICS:\n`;
        processedText += `Total Income: ₹${snapshot.stats.budgetStats?.totalIncome?.amount || 0}\n`;
        processedText += `Amount Received: ₹${snapshot.stats.budgetStats?.amountReceived?.amount || 0}\n`;
        processedText += `Total Expenses: ₹${snapshot.stats.budgetStats?.totalExpenses?.amount || 0}\n`;
        processedText += `Amount Left: ₹${snapshot.stats.budgetStats?.amountLeft?.amount || 0}\n`;
      }

      // Split into chunks and generate embeddings
      const chunks = splitIntoChunks(processedText);
      const processedChunks = [];

      for (const chunk of chunks) {
        try {
          const embedding = await generateEmbedding(chunk);
          
          const processedChunk = new ProcessedChunk({
            eventName: record.eventName,
            year: record.year,
            chunkText: chunk,
            embedding,
            metadata: {
              snapshotId: record.snapshotId,
              selectedCollections: record.selectedCollections
            },
            status: 'ready',
            createdBy: req.user.registerId
          });
          
          processedChunks.push(processedChunk);
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }

      // Save chunks
      if (processedChunks.length > 0) {
        await ProcessedChunk.insertMany(processedChunks);
      }

      // Update record status
      record.chunksCount = processedChunks.length;
      record.status = processedChunks.length > 0 ? 'ready' : 'error';
      await record.save();

      res.json({ 
        message: 'Record processed successfully', 
        chunksCount: processedChunks.length 
      });
    } catch (error) {
      console.error('Processing error:', error);
      
      // Update status to error
      const record = await ProcessedRecord.findById(req.params.id);
      if (record) {
        record.status = 'error';
        await record.save();
      }
      
      res.status(500).json({ message: 'Failed to process record' });
    }
  }
};

// Helper function to split text into chunks
const splitIntoChunks = (text, maxTokens = 500) => {
  const sentences = text.split(/[.!?]\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length > maxTokens) {
      // Split very long sentences
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