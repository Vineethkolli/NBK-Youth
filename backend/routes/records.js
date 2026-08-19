import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { financialRecordsController } from '../controllers/financialRecordsController.js';
import { timelineRecordsController } from '../controllers/timelineRecordsController.js';
import { eventRecordsController } from '../controllers/eventRecordsController.js';

const router = express.Router();

// Financial Timeline Routes
router.get('/financial', financialRecordsController.getAllFinancialRecords);
router.get('/financial/events/:eventName', financialRecordsController.getFinancialRecordsByEvent);
router.get('/financial/event-names', financialRecordsController.getUniqueEventNames);
router.post('/financial', auth, checkRole('Developer'), financialRecordsController.createFinancialRecord);
router.put('/financial/:id', auth, checkRole('Developer'), financialRecordsController.updateFinancialRecord);
router.delete('/financial/:id', auth, checkRole('Developer'), financialRecordsController.deleteFinancialRecord);

// Records Timeline Routes
router.get('/timeline', timelineRecordsController.getAllTimelineRecords);
router.get('/timeline/events/:eventName', timelineRecordsController.getTimelineRecordsByEvent);
router.get('/timeline/event-names', timelineRecordsController.getUniqueTimelineEventNames);
router.post('/timeline', auth, checkRole('Developer'), timelineRecordsController.createTimelineRecord);
router.put('/timeline/:id', auth, checkRole('Developer'), timelineRecordsController.updateTimelineRecord);
router.delete('/timeline/:id', auth, checkRole('Developer'), timelineRecordsController.deleteTimelineRecord);

// Event Records Routes
router.get('/event-records', eventRecordsController.getAllEventRecords);
router.get('/event-records/event-names', eventRecordsController.getUniqueEventRecordNames);
router.post('/event-records/check', auth, checkRole('Developer'), eventRecordsController.checkEventRecord);
router.post('/event-records', auth, checkRole('Developer'), eventRecordsController.createEventRecord);
router.put('/event-records/:id', auth, checkRole('Developer'), eventRecordsController.updateEventRecord);
router.delete('/event-records/:id', auth, checkRole('Developer'), eventRecordsController.deleteEventRecord);

export default router;
