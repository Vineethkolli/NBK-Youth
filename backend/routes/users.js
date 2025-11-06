import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { getAllUsers, updateUserCategory, updateUserRole, updateUserProfile, 
     deleteUser } from '../controllers/usersController.js';

const router = express.Router();


router.get('/', auth, checkRole(['developer', 'financier', 'admin']), getAllUsers);
router.patch('/:userId/category', auth, checkRole(['developer', 'financier', 'admin']), updateUserCategory);
router.patch('/:userId/role', auth, checkRole(['developer', 'financier', 'admin']), updateUserRole);

router.patch('/:userId', auth, checkRole(['developer']), updateUserProfile);
router.delete('/:userId', auth, checkRole(['developer']), deleteUser);

export default router;
