import { Router } from 'express';
import { 
    getAllHotels, 
    getHotelByName, 
    createHotel, 
    updateHotel, 
    deleteHotel,
    getHotelsWithReviews,
    getHotelDetailsWithReviews
} from '../controllers/hotelController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkPermission } from '../middleware/permisionMiddleware';

const router = Router();

//protected routes
router.post('/hotels', authenticateToken, checkPermission('hotels', 'write'), createHotel);
router.put('/hotels/:id', authenticateToken, checkPermission('hotels', 'write'), updateHotel);
router.delete('/hotels/:id', authenticateToken, checkPermission('hotels', 'write'), deleteHotel);

//public routes
router.get('/hotels', getAllHotels);
router.get('/hotels/:name', getHotelByName);
router.get('/hotels-with-reviews', getHotelsWithReviews);
router.get('/hotels/:id/details', getHotelDetailsWithReviews);

export default router;