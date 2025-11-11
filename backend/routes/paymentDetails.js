import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { paymentDetailsController } from '../controllers/paymentDetailsController.js';

const router = express.Router();

router.get('/', paymentDetailsController.getPaymentDetails);
router.put('/', auth, checkRole('Privileged'), paymentDetailsController.updatePaymentDetails);

export default router;
