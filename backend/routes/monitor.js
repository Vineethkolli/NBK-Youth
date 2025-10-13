import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import {
  getDriveMonitorData,
  trashFolder,
  restoreFolder,
  deleteFolderPermanent
} from '../controllers/serviceDriveController.js';

const router = express.Router();

router.get('/drive', auth, checkRole(['developer']), getDriveMonitorData);

router.put('/folder/trash/:fileId', auth, checkRole(['developer']), trashFolder);
router.put('/folder/restore/:fileId', auth, checkRole(['developer']), restoreFolder);
router.delete('/folder/delete/:fileId', auth, checkRole(['developer']), deleteFolderPermanent);

export default router;
