import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { committeeController } from '../controllers/committeeController.js';

const router = express.Router();

router.get('/', committeeController.getAllMembers);
router.post('/', auth, checkRole('Privileged'), committeeController.addMember);
router.put('/order', auth, checkRole('Privileged'), committeeController.updateOrder);
router.delete('/:id', auth, checkRole('Privileged'), committeeController.removeMember);

export default router;