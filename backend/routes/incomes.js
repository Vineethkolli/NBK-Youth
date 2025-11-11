import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { incomeController } from '../controllers/incomeController.js';

const router = express.Router();

router.get('/', auth, incomeController.getIncomes);

router.get('/verification', auth, checkRole('Pro'), incomeController.getVerificationData);
router.post('/', auth, checkRole('Privileged'), incomeController.createIncome);
router.put('/:id', auth, checkRole('Privileged'), incomeController.updateIncome);
router.patch('/:id/verify', auth, checkRole('Pro'), incomeController.updateVerificationStatus);

// Soft delete income (move to recycle bin)
router.delete('/:id', auth, checkRole('Privileged'), incomeController.deleteIncome);
router.get('/recycle-bin', auth, checkRole('Pro'), incomeController.getRecycleBin);
router.post('/restore/:id', auth, checkRole('Pro'), incomeController.restoreIncome);

// Permanently delete from recycle bin
router.delete('/permanent/:id', auth, checkRole('Pro'), incomeController.permanentDeleteIncome);

export default router;
