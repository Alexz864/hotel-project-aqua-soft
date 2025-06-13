import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserPayload } from '../types';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    //extract Authorization header from request
    const authHeader = req.headers['authorization'];

    //split Authorization header and extract the token(index[1])
    const token = authHeader && authHeader.split(' ')[1]; //Bearer TOKEN

    if (!token) {
        res.status(401).json({ 
            error: 'Access denied. No token provided.',
            message: 'Please include a valid JWT token in the Authorization header as: Bearer <token>'
        });
        return;
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        //verify the token using the secret_key and cast the result to JWTPayload type
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        //add deocded user info to request object
        req.user = {
            id: decoded.id,
            email: decoded.email
        };
        
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ 
                error: 'Token expired',
                message: 'Your authentication token has expired. Please log in again.'
            });
            return;
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({ 
                error: 'Invalid token',
                message: 'The provided token is invalid or malformed.'
            });
            return;
        }
        
        res.status(500).json({ 
            error: 'Token verification failed',
            message: 'An error occurred while verifying your token.'
        });
    }
};

//utility function to generate JWT tokens for testing
export const generateToken = (payload: UserPayload): string => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

//simple auth route for testing
export const loginForTesting = (req: Request, res: Response): void => {
    //this is a simple mock login for testing purposes
    //in a real login system we would validate credentials against a database
    const { email, password } = req.body;
    
    if (!email || !password) {
        res.status(400).json({ 
            error: 'Email and password are required' 
        });
        return;
    }
    
    //mock user validation
    if (email === 'test@example.com' && password === 'password123') {
        const token = generateToken({ 
            id: '1', 
            email: email 
        });
        
        res.json({ 
            message: 'Login successful',
            token: token,
            user: { id: '1', email: email }
        });
    } else {
        res.status(401).json({ 
            error: 'Invalid credentials' 
        });
    }
};