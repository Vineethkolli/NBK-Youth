import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { eventLabelController } from '../controllers/eventLabelController.js';

const router = express.Router();

router.get('/', eventLabelController.getEventLabel);
router.post('/', auth, checkRole('Privileged'), eventLabelController.createEventLabel);
router.put('/:id', auth, checkRole('Privileged'), eventLabelController.updateEventLabel);
router.delete('/:id', auth, checkRole('Privileged'), eventLabelController.deleteEventLabel);

export default router;
