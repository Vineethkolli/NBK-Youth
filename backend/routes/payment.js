import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', PaymentController.getAllPayments);
router.get('/:paymentId', PaymentController.getPaymentById);

router.get('/verification/data', auth, checkRole('Pro'), PaymentController.getVerificationData);

router.post('/', PaymentController.createPayment);

router.patch('/:id/verify', auth, checkRole('Pro'), PaymentController.updateVerificationStatus);

router.delete('/:paymentId', PaymentController.deletePayment);

export default router;
