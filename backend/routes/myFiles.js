import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { myFilesController } from '../controllers/myFilesController.js';

const router = express.Router();

// Files Routes
router.get('/files', auth, checkRole('Privileged'), myFilesController.listFiles);
router.get('/files/:id', auth, checkRole('Privileged'), myFilesController.getFile);
router.get('/files/:id/download', auth, checkRole('Privileged'), myFilesController.downloadFile);
router.post('/files', auth, checkRole('Privileged'), myFilesController.createFile);
router.put('/files/:id', auth, checkRole('Privileged'), myFilesController.updateFile);
router.delete('/files/:id', auth, checkRole('Privileged'), myFilesController.deleteFile);


// Notes Routes
router.get('/notes', auth, checkRole('Privileged'), myFilesController.listNotes);
router.get('/notes/:id', auth, checkRole('Privileged'), myFilesController.getNote);
router.post('/notes', auth, checkRole('Privileged'), myFilesController.createNote);
router.put('/notes/:id', auth, checkRole('Privileged'), myFilesController.updateNote);
router.delete('/notes/:id', auth, checkRole('Privileged'), myFilesController.deleteNote);

export default router;
