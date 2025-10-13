import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { 
    getStorageQuota, 
    getFileList,
    getTrashList,
    trashItem, 
    restoreItem, 
    deleteItemPermanent,
    downloadItem
} from '../controllers/serviceDriveController.js';

const router = express.Router();

// Storage quota and user info (can be fetched once)
router.get('/drive/quota', auth, checkRole(['developer']), getStorageQuota);

// File and folder list for a given parentId
router.get('/drive/files', auth, checkRole(['developer']), getFileList);

// Trashed items list
router.get('/drive/trash', auth, checkRole(['developer']), getTrashList);

// Item actions
router.put('/item/trash/:fileId', auth, checkRole(['developer']), trashItem);
router.put('/item/restore/:fileId', auth, checkRole(['developer']), restoreItem);
router.delete('/item/delete/:fileId', auth, checkRole(['developer']), deleteItemPermanent);
router.get('/item/download/:fileId', auth, checkRole(['developer']), downloadItem); // Use GET for download

export default router;
