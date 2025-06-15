import { Request, Response, NextFunction } from 'express';
import db from '../models';

const { Permission, Role } = db;

//middleware to check permissions
export const checkPermission = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: 'Authentication required.',
                    message: 'Please log in to access this resource.'
                });
                return;
            }

            //find user's role
            const role = await Role.findOne({
                where: { RoleName: req.user.role }
            });

            if (!role) {
                res.status(403).json({
                    error: 'Invalid role.',
                    message: 'User role not found.'
                });
                return;
            }

            //check if role has permission
            const permission = await Permission.findOne({
                where: {
                    RoleID: role.RoleID,
                    Resource: resource,
                    Action: action
                }
            });

            if (!permission) {
                res.status(403).json({
                    error: 'Access denied.',
                    message: `You don't have permission to ${action} ${resource}.`
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Error checking permissions:', error);
            res.status(500).json({
                error: 'Permission check failed.',
                message: 'An error occurred while checking permissions.'
            });
        }
    };
};

//check if user has admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Admin access required.',
            message: 'Only administrators can access this resource.'
        });
        return;
    }
    next();
};