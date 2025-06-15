import { Router } from 'express';
import { getMyHotels, reassignHotel } from '../controllers/managerController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkPermission } from '../middleware/permisionMiddleware';
import { requireAdmin } from '../middleware/permisionMiddleware';

const router = Router();

//route for managers to view their own hotels
router.get('/my-hotels', authenticateToken, checkPermission('own_hotels', 'read'), getMyHotels);

//route for admins to manage hotel assignments
router.put('/reassign-hotel/:hotelId', authenticateToken, requireAdmin, reassignHotel);

export default router;