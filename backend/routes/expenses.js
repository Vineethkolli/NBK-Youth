import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { expenseController } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', auth, expenseController.getExpenses);

router.get('/verification', auth, checkRole('Pro'), expenseController.getVerificationData);
router.post('/', auth, checkRole('Pro'), expenseController.createExpense);
router.put('/:id', auth, checkRole('Pro'), expenseController.updateExpense);
router.patch('/:id/verify', auth, checkRole('Pro'), expenseController.updateVerificationStatus);

// Soft delete expense (move to recycle bin)
router.delete('/:id', auth, checkRole('Pro'), expenseController.deleteExpense);
router.get('/recycle-bin', auth, checkRole('Pro'), expenseController.getRecycleBin);
router.post('/restore/:id', auth, checkRole('Pro'), expenseController.restoreExpense);

// Permanently delete from recycle bin
router.delete('/permanent/:id', auth, checkRole('Pro'), expenseController.permanentDeleteExpense);

export default router;
