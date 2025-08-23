import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { viniController } from '../controllers/viniController.js';

const router = express.Router();

// Get all processed events (developer only)
router.get('/processed-events', 
  auth, 
  checkRole(['developer']),
  viniController.getAllProcessedEvents
);

// Process current data into historical chunks (developer only)
router.post('/process-data', 
  auth, 
  checkRole(['developer']),
  viniController.processCurrentData
);

// Update processed event (developer only)
router.put('/processed-events', 
  auth, 
  checkRole(['developer']),
  viniController.updateProcessedEvent
);

// Delete processed event (developer only)
router.delete('/processed-events', 
  auth, 
  checkRole(['developer']),
  viniController.deleteProcessedEvent
);

// Reprocess event data (developer only)
router.post('/reprocess-event', 
  auth, 
  checkRole(['developer']),
  viniController.reprocessEvent
);

// Chat with VINI (all authenticated users)
router.post('/chat', auth, viniController.chatWithVini);

// Get chat history (all authenticated users)
router.get('/chat-history/:registerId', auth, viniController.getChatHistory);

// Clear chat history (all authenticated users)
router.delete('/chat-history/:registerId', auth, viniController.clearChatHistory);

export default router;