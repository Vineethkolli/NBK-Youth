import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { estimationController } from '../controllers/estimationController.js';

const router = express.Router();

// Income routes
router.get('/income', auth, estimationController.getAllEstimatedIncomes);
router.post('/income', auth, checkRole(['admin','developer', 'financier']), estimationController.createEstimatedIncome);
router.put('/income/:id', auth, checkRole(['admin','developer', 'financier']), estimationController.updateEstimatedIncome);
router.delete('/income/:id', auth, checkRole(['admin','developer', 'financier']), estimationController.deleteEstimatedIncome);

// Expense routes
router.get('/expense', auth, estimationController.getAllEstimatedExpenses);
router.post('/expense', auth, checkRole(['admin','developer', 'financier']), estimationController.createEstimatedExpense);
router.put('/expense/:id', auth, checkRole(['admin','developer', 'financier']), estimationController.updateEstimatedExpense);
router.delete('/expense/:id', auth, checkRole(['admin','developer', 'financier']), estimationController.deleteEstimatedExpense);

// Stats route
router.get('/stats', auth, estimationController.getEstimationStats);

export default router;