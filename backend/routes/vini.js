import express from 'express';
import { auth } from '../middleware/auth.js';
import { viniController } from '../controllers/viniController.js';

const router = express.Router();

// Process VINI query
router.post('/query', auth, viniController.processQuery);

// Get chat history
router.get('/history', auth, viniController.getChatHistory);

// Clear chat history
router.delete('/history', auth, viniController.clearChatHistory);

export default router;