import express from 'express';
import { auth } from '../middleware/auth.js';
import cloudinaryController from '../controllers/cloudinaryController.js';

const router = express.Router();

// Authenticated route to request a signed upload (protects API secret)
router.post('/sign', auth, cloudinaryController.getSignature);

export default router;

