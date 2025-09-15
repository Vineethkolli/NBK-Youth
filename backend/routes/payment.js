
import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import { auth, checkRole } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', PaymentController.getAllPayments);

router.get('/:paymentId', PaymentController.getPaymentById);

// fetch payments by verification status (verifyLog)
router.get('/verification/data', auth, checkRole(['developer', 'financier']), PaymentController.getVerificationData);

// create a new payment
router.post('/', upload.single('screenshot'), PaymentController.createPayment);

// update payment details
router.put('/:id', auth, checkRole(['developer', 'financier']), PaymentController.updatePayment);

// update verification status
router.patch('/:id/verify', auth, checkRole(['developer', 'financier']), PaymentController.updateVerificationStatus);

router.delete('/:paymentId', PaymentController.deletePayment);

export default router;