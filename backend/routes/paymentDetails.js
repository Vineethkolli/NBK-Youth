import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { paymentDetailsController } from '../controllers/paymentDetailsController.js';

const router = express.Router();

// Get payment details (public)
router.get('/', paymentDetailsController.getPaymentDetails);

// Update payment details (developer only)
router.put('/', 
  auth, 
  checkRole(['developer', 'finanicer', 'admin']),
  paymentDetailsController.updatePaymentDetails
);

export default router;