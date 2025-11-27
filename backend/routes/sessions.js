import express from 'express';
import { refreshAccessToken, updateLastActive, getUserSessions, signOutSession, 
  signOutCurrent, getAllSessions, getSessionsStats } from '../controllers/sessionController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/refresh', refreshAccessToken);
router.post('/last-active', updateLastActive);

router.get('/', auth, getUserSessions);
router.post('/signout', signOutCurrent);
router.delete('/:sessionId', auth, signOutSession);

router.get('/auth-sessions', auth, checkRole('Developer'), getAllSessions);
router.get('/stats', auth, checkRole('Developer'), getSessionsStats);

export default router;
