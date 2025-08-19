import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { recordController } from '../controllers/recordController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Get all records
router.get('/', auth, recordController.getAllRecords);

// Create record (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  upload.fields([
    { name: 'viewingFile', maxCount: 1 },
    { name: 'processingFile', maxCount: 1 }
  ]),
  recordController.createRecord
);

// Update record
router.put('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  recordController.updateRecord
);

// Delete record
router.delete('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  recordController.deleteRecord
);

// Process file
router.post('/:id/process',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  recordController.processRecord
);

// Reprocess file
router.post('/:id/reprocess',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  recordController.reprocessRecord
);

export default router;