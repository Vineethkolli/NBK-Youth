import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { viniController } from '../controllers/viniController.js';

const router = express.Router();

// Chat with VINI (all authenticated users)
router.post('/chat', auth, viniController.chatWithVini);

// Get chat history (all authenticated users)
router.get('/chat-history/:registerId', auth, viniController.getChatHistory);

// Clear chat history (all authenticated users)
router.delete('/chat-history/:registerId', auth, viniController.clearChatHistory);

export default router;