import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { committeeController } from '../controllers/committeeController.js';

const router = express.Router();

// Get all committee members (public)
router.get('/', committeeController.getAllMembers);

// Add committee member (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  committeeController.addMember
);

// Update member order (privileged users only)
router.put('/order', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  committeeController.updateOrder
);

// Remove committee member (privileged users only)
router.delete('/:id', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  committeeController.removeMember
);

export default router;