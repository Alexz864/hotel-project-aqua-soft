import { Router } from 'express';
import { 
    getAllUsers, 
    getUserById,
    createUser, 
    updateUser,
    updateUserRole, 
    deleteUser
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/permisionMiddleware';

const router = Router();

//admin only user management routes
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.get('/users/:id', authenticateToken, requireAdmin, getUserById);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.put('/users/:id/role', authenticateToken, requireAdmin, updateUserRole);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

export default router;