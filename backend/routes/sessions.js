import express from 'express';
import { refreshAccessToken, updateLastActive, getUserSessions, signOutSession, 
  signOutCurrent, invalidateUserSessions, invalidateAllSessions, getAllSessions, getSessionsStats } from '../controllers/sessionController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/refresh', refreshAccessToken);
router.post('/last-active', updateLastActive);

router.get('/', auth, getUserSessions);
router.post('/signout', auth, signOutCurrent);
router.delete('/:sessionId', auth, signOutSession);
router.post('/user/:userId/invalidate', auth, checkRole('Developer'), invalidateUserSessions);
router.post('/invalidate-all', auth, checkRole('Developer'), invalidateAllSessions);

router.get('/auth-sessions', auth, checkRole('Developer'), getAllSessions);
router.get('/stats', auth, checkRole('Developer'), getSessionsStats);

export default router;
