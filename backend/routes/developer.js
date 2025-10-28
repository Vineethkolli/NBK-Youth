import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { developerController } from '../controllers/developerController.js';

const router = express.Router();

router.delete('/clear/:type',  auth, checkRole(['developer']), developerController.clearData);

export default router;