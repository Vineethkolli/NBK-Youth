import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { estimationController } from '../controllers/estimationController.js';

const router = express.Router();

router.get('/stats', auth, estimationController.getEstimationStats);

router.get('/income', auth, estimationController.getAllEstimatedIncomes);
router.post('/income', auth, checkRole('Pro'), estimationController.createEstimatedIncome);
router.put('/income/:id', auth, checkRole('Pro'), estimationController.updateEstimatedIncome);
router.delete('/income/:id', auth, checkRole('Pro'), estimationController.deleteEstimatedIncome);

router.get('/expense', auth, estimationController.getAllEstimatedExpenses);
router.post('/expense', auth, checkRole('Pro'), estimationController.createEstimatedExpense);
router.put('/expense/:id', auth, checkRole('Pro'), estimationController.updateEstimatedExpense);
router.delete('/expense/:id', auth, checkRole('Pro'), estimationController.deleteEstimatedExpense);

export default router;
