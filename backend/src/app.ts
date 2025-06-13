import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hotelRoutes from './routes/hotelRoutes';

//load environment variables
dotenv.config();

//initialize express application
const app: Application = express();

//middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api', hotelRoutes);

//health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Hotel API is running.',
        timestamp: new Date().toISOString()
    });
});

//404 route handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found.',
        message: `The requested route ${req.originalUrl} does not exist.`,
        availableRoutes: {
            public: [
                'GET /api/hotels - Get all hotels',
                'GET /api/hotels/:name - Get hotel by name'
            ],
            protected: [
                'POST /api/auth/login - Login for testing',
                'POST /api/hotels - Create new hotel (requires auth)',
                'PUT /api/hotels/:id - Update hotel (requires auth)',
                'DELETE /api/hotels/:id - Delete hotel (requires auth)'
            ]
        }
    });
});

//error handling middleware for unexpected errors
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error.'
    });
});

export default app;