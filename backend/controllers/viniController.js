import ProcessedChunk from '../models/ProcessedChunk.js';
import ChatHistory from '../models/ChatHistory.js';
import ProcessedRecord from '../models/ProcessedRecords.js';
import { processRecordIntoChunks, buildSnapshotTextFromRecord } from '../services/processedRecordsService.js';
import { chatWithViniLogic } from '../services/viniService.js';
import { logActivity } from '../middleware/activityLogger.js';

export const viniController = {

  getAllProcessedRecords: async (req, res) => {
    try {
      const records = await ProcessedRecord.find()
        .populate('snapshotId')
        .sort({ year: -1, eventName: 1 })
        .lean();

      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch processed records' });
    }
  },


  createProcessedRecord: async (req, res) => {
    try {
      const { snapshotId, eventName, year, selectedCollections } = req.body;
      const createdBy = req.user.registerId;

      const existingRecord = await ProcessedRecord.findOne({ eventName, year }).lean();
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

      await logActivity(
        req,
        'CREATE',
        'ProcessedRecord',
        record._id,
        { before: null, after: { eventName, year, selectedCollections, snapshotId } },
        `Processed record created for ${eventName} ${year}`
      );

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

      const previousState = {
        status: record.status,
        chunksCount: record.chunksCount
      };

      record.status = 'processing';
      await record.save();

      // Build snapshot text and process into chunks via processedRecordsService
      const { allText, metadata } = buildSnapshotTextFromRecord(record);
      const chunkCount = await processRecordIntoChunks(record, allText, metadata, record.createdBy);

      record.chunksCount = chunkCount;
      record.status = 'ready';
      await record.save();

      await logActivity(
        req,
        'UPDATE',
        'ProcessedRecord',
        record._id,
        {
          before: previousState,
          after: { status: record.status, chunksCount: record.chunksCount }
        },
        `Processed record data for ${record.eventName} ${record.year}`
      );

      res.json({ message: 'Data processed successfully', chunkCount });
    } catch (error) {
      console.error('Processing error:', error);

      const record = await ProcessedRecord.findById(req.params.id);
      if (record) {
        record.status = 'error';
        await record.save();
      }
      res.status(500).json({ message: 'Failed to process data' });
    }
  },


  reprocessRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id).populate('snapshotId');
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }

      const previousState = {
        status: record.status,
        chunksCount: record.chunksCount
      };

      // Delete existing chunks
      await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });

      record.status = 'processing';
      record.chunksCount = 0;
      await record.save();

      // Reprocess the snapshot data using the shared service
      const { allText, metadata } = buildSnapshotTextFromRecord(record);
      const chunkCount = await processRecordIntoChunks(record, allText, metadata, record.createdBy);

      record.chunksCount = chunkCount;
      record.status = 'ready';
      await record.save();

      await logActivity(
        req,
        'UPDATE',
        'ProcessedRecord',
        record._id,
        {
          before: previousState,
          after: { status: record.status, chunksCount: record.chunksCount }
        },
        `Reprocessed data for ${record.eventName} ${record.year}`
      );

      res.json({ message: 'Data reprocessed successfully', chunkCount });
    } catch (error) {
      console.error('Reprocessing error:', error);
      res.status(500).json({ message: 'Failed to reprocess data' });
    }
  },

 
  deleteProcessedRecord: async (req, res) => {
    try {
      const record = await ProcessedRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Processed record not found' });
      }
      const originalData = {
        eventName: record.eventName,
        year: record.year,
        snapshotId: record.snapshotId,
        selectedCollections: record.selectedCollections,
        chunksCount: record.chunksCount,
        status: record.status,
        createdBy: record.createdBy
      };
      await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });

      await ProcessedRecord.findByIdAndDelete(req.params.id);

      await logActivity(
        req,
        'DELETE',
        'ProcessedRecord',
        record._id,
        { before: originalData, after: null },
        `Processed record deleted for ${record.eventName} ${record.year}`
      );

      res.json({ message: 'Processed record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete processed record' });
    }
  },


  chatWithVini: async (req, res) => {
    try {
      const { message, registerId } = req.body;
      const response = await chatWithViniLogic({ message, registerId });
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: 'Failed to process chat' });
    }
  },


  getChatHistory: async (req, res) => {
    try {
      const { registerId } = req.params;
      const chatHistory = await ChatHistory.findOne({ registerId });

      res.json(chatHistory?.chats || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat history' });
    }
  },


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
