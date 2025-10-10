import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { recordsController } from '../controllers/recordsController.js';

const router = express.Router();

// Financial Timeline Routes
router.get('/financial', recordsController.getAllFinancialRecords);
router.get('/financial/events/:eventName', recordsController.getFinancialRecordsByEvent);
router.get('/financial/event-names', recordsController.getUniqueEventNames);
router.post('/financial', auth, checkRole(['developer']), recordsController.createFinancialRecord);
router.put('/financial/:id', auth, checkRole(['developer']), recordsController.updateFinancialRecord);
router.delete('/financial/:id', auth, checkRole(['developer']), recordsController.deleteFinancialRecord);

// Event Records Routes
router.get('/event-records', recordsController.getAllEventRecords);
router.get('/event-records/event-names', recordsController.getUniqueEventRecordNames);
router.post('/event-records', auth, checkRole(['developer']), recordsController.createEventRecord);
router.put('/event-records/:id', auth, checkRole(['developer']), recordsController.updateEventRecord);
router.delete('/event-records/:id', auth, checkRole(['developer']), recordsController.deleteEventRecord);

export default router;
