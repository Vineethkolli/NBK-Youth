import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { incomeController } from '../controllers/incomeController.js';

const router = express.Router();

router.get('/', auth, incomeController.getIncomes);

router.get('/verification', auth, checkRole(['developer', 'financier']), incomeController.getVerificationData);

router.post('/', auth, checkRole(['admin','developer', 'financier']), incomeController.createIncome);
router.put('/:id', auth, checkRole(['admin','developer', 'financier']), incomeController.updateIncome);

router.patch('/:id/verify', auth, checkRole(['developer', 'financier']), incomeController.updateVerificationStatus);

// Soft delete income (move to recycle bin)
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), incomeController.deleteIncome);

router.get('/recycle-bin', auth, checkRole(['developer', 'financier']), incomeController.getRecycleBin);

router.post('/restore/:id', auth, checkRole(['developer', 'financier']), incomeController.restoreIncome);

// Permanently delete from recycle bin
router.delete('/permanent/:id', auth, checkRole(['developer', 'financier']), incomeController.permanentDeleteIncome);

export default router;