import { Router } from 'express';
import { 
    getAllHotels, 
    getHotelByName, 
    createHotel, 
    updateHotel, 
    deleteHotel
} from '../controllers/hotelController';
import { authenticateToken, loginForTesting } from '../middleware/authMiddleware';

const router = Router();

//auth route for testing
router.post('/auth/login', loginForTesting);

//protected routes
router.post('/hotels', authenticateToken, createHotel);
router.put('/hotels/:id', authenticateToken, updateHotel);
router.delete('/hotels/:id', authenticateToken, deleteHotel);

//public routes
router.get('/hotels', getAllHotels);
router.get('/hotels/:name', getHotelByName);

export default router;