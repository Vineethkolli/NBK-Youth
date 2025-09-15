import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { committeeController } from '../controllers/committeeController.js';

const router = express.Router();

router.get('/', committeeController.getAllMembers);
router.post('/', auth, checkRole(['developer', 'financier', 'admin']), committeeController.addMember);
router.put('/order', auth, checkRole(['developer', 'financier', 'admin']), committeeController.updateOrder);
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), committeeController.removeMember);

export default router;