import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { authLogController } from '../controllers/authLogController.js';

const router = express.Router();

router.get('/', auth, checkRole(['Developer']), authLogController.getAll);

export default router;
