import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { processedRecordController } from '../controllers/processedRecordController.js';

const router = express.Router();

// Get all processed records (developer only)
router.get('/', 
  auth, 
  checkRole(['developer']),
  processedRecordController.getAllProcessedRecords
);

// Create processed record (developer only)
router.post('/', 
  auth, 
  checkRole(['developer']),
  processedRecordController.createProcessedRecord
);

// Update processed record (developer only)
router.put('/:id', 
  auth, 
  checkRole(['developer']),
  processedRecordController.updateProcessedRecord
);

// Delete processed record (developer only)
router.delete('/:id', 
  auth, 
  checkRole(['developer']),
  processedRecordController.deleteProcessedRecord
);

// Process/Reprocess record (developer only)
router.post('/:id/process', 
  auth, 
  checkRole(['developer']),
  processedRecordController.processRecord
);

export default router;