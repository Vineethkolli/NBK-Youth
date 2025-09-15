import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { expenseController } from '../controllers/expenseController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', auth, expenseController.getExpenses);

router.get('/verification',  auth, checkRole(['developer', 'financier']), expenseController.getVerificationData);

router.post('/', auth, checkRole(['developer', 'financier']), upload.single('billImage'), expenseController.createExpense);

router.put('/:id', auth, checkRole(['developer', 'financier']), upload.single('billImage'), expenseController.updateExpense);

router.patch('/:id/verify', auth, checkRole(['developer', 'financier']), expenseController.updateVerificationStatus);

// Soft delete expense (move to recycle bin)
router.delete('/:id', auth, checkRole(['developer', 'financier']), expenseController.deleteExpense);

router.get('/recycle-bin', auth, checkRole(['developer', 'financier']), expenseController.getRecycleBin);

router.post('/restore/:id', auth, checkRole(['developer', 'financier']), expenseController.restoreExpense);

// Permanently delete from recycle bin
router.delete('/permanent/:id', auth, checkRole(['developer', 'financier']), expenseController.permanentDeleteExpense);

export default router;