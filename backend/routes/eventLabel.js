import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { eventLabelController } from '../controllers/eventLabelController.js';

const router = express.Router();

// Get current event label (public)
router.get('/', eventLabelController.getEventLabel);

// Create event label (admin only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  eventLabelController.createEventLabel
);

// Update event label (admin only)
router.put('/:id', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  eventLabelController.updateEventLabel
);

// Delete event label (admin only)
router.delete('/:id', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  eventLabelController.deleteEventLabel
);

export default router;