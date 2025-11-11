import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { viniController } from '../controllers/viniController.js';

const router = express.Router();

// Processed Records routes
router.get('/processed-records', auth, checkRole('Developer'), viniController.getAllProcessedRecords);
router.post('/processed-records', auth, checkRole('Developer'), viniController.createProcessedRecord);
router.post('/process-record/:id', auth, checkRole('Developer'), viniController.processRecord);
router.post('/reprocess-record/:id', auth, checkRole('Developer'), viniController.reprocessRecord);
router.delete('/processed-records/:id', auth, checkRole('Developer'), viniController.deleteProcessedRecord);

// VINI routes
router.post('/chat', auth, viniController.chatWithVini);
router.get('/chat-history/:registerId', auth, viniController.getChatHistory);
router.delete('/chat-history/:registerId', auth, viniController.clearChatHistory);

export default router;
