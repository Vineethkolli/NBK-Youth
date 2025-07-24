import express from 'express';
import { auth, checkPermission } from '../middleware/auth.js';
import { incomeController } from '../controllers/incomeController.js';

const router = express.Router();

// Get all incomes with filters
router.get('/', auth, incomeController.getIncomes);

// Get verification data
router.get('/verification', 
  auth, 
  checkPermission('ACCESS_LOGS'),
  incomeController.getVerificationData
);

// Add new income (admin, developer, financier only)
router.post('/', 
  auth, 
  checkPermission('MANAGE_INCOME'),
  incomeController.createIncome
);

// Update income
router.put('/:id', 
  auth, 
  checkPermission('MANAGE_INCOME'),
  incomeController.updateIncome
);

// Update verification status
router.patch('/:id/verify',
  auth,
  checkPermission('ACCESS_LOGS'),
  incomeController.updateVerificationStatus
);

// Get modification logs
router.get('/logs', 
  auth, 
  checkPermission('ACCESS_LOGS'),
  incomeController.getLogs
);

// Soft delete income (move to recycle bin)
router.delete('/:id', 
  auth, 
  checkPermission('DELETE_INCOME'),
  incomeController.deleteIncome
);

// Get recycle bin items
router.get('/recycle-bin', 
  auth, 
  checkPermission('DELETE_INCOME'),
  incomeController.getRecycleBin
);

// Restore from recycle bin
router.post('/restore/:id', 
  auth, 
  checkPermission('DELETE_INCOME'),
  incomeController.restoreIncome
);

// Permanently delete from recycle bin
router.delete('/permanent/:id', 
  auth, 
  checkPermission('DELETE_INCOME'),
  incomeController.permanentDeleteIncome
);

export default router;