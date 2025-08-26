import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { viniController } from '../controllers/viniController.js';

const router = express.Router();

// Get all processed records (developer only)
router.get('/processed-records', 
  auth, 
  checkRole(['developer']),
  viniController.getAllProcessedRecords
);

// Create processed record from snapshot (developer only)
router.post('/processed-records', 
  auth, 
  checkRole(['developer']),
  viniController.createProcessedRecord
);

// Process record data into chunks (developer only)
router.post('/process-record/:id', 
  auth, 
  checkRole(['developer']),
  viniController.processRecord
);

// Reprocess record data (developer only)
router.post('/reprocess-record/:id', 
  auth, 
  checkRole(['developer']),
  viniController.reprocessRecord
);

// Delete processed record (developer only)
router.delete('/processed-records/:id', 
  auth, 
  checkRole(['developer']),
  viniController.deleteProcessedRecord
);

// Chat with VINI (all authenticated users)
router.post('/chat', auth, viniController.chatWithVini);

// Get chat history (all authenticated users)
router.get('/chat-history/:registerId', auth, viniController.getChatHistory);

// Clear chat history (all authenticated users)
router.delete('/chat-history/:registerId', auth, viniController.clearChatHistory);

export default router;