import { Request, Response } from 'express';
import db from '../models';
import { ApiResponse, UserCreationAttributes } from '../types';
import { generateToken } from '../middleware/authMiddleware';
import { Op, Transaction } from 'sequelize';

const { User, Role, sequelize } = db;

//POST /auth/register
export const register = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {

        const { username, password, email } = req.body;

        //validate required fields
        if (!username || !password || !email) {
            await transaction.rollback();

            const errorResponse: ApiResponse = {
                success: false,
                error: 'Missing required fields.',
                message: 'Username, password, and email are required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { Username: username },
                    { Email: email }
                ]
            },
            transaction
        });

        if (existingUser) {
            await transaction.rollback();

            const errorResponse: ApiResponse = {
                success: false,
                error: 'User already exists.',
                message: 'Username or email is already taken.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //auto-assign traveler role to new users
        const travelerRole = await Role.findOne({
            where: { RoleName: 'traveler' },
            transaction
        });

        if (!travelerRole) {
            await transaction.rollback();

            const errorResponse: ApiResponse = {
                success: false,
                error: 'System error.',
                message: 'Default role not found.'
            };
            res.status(500).json(errorResponse);
            return;
        }

        //create new user
        const newUser = await User.create({
            Username: username,
            Password: password,
            Email: email,
            RoleID: travelerRole.RoleID
        } as UserCreationAttributes, { transaction });

        //fetch user with role information
        const createdUser = await User.findByPk(newUser.UserID, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName']
            }],
            attributes: ['UserID', 'Username', 'Email'],
            transaction
        });

        await transaction.commit();

        const response: ApiResponse = {
            success: true,
            message: 'User registered successfully.',
            data: createdUser
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error registering user:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to register user.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//POST /auth/login
export const login = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            await transaction.rollback();

            const errorResponse: ApiResponse = {
                success: false,
                error: 'Username and password are required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //find user with role information
        const user = await User.findOne({
            where: { Username: username },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName']
            }],
            transaction
        });

        if (!user || !(await user.validatePassword(password))) {
            await transaction.rollback();

            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid credentials.'
            };
            res.status(401).json(errorResponse);
            return;
        }

        await transaction.commit();

        //generate JWT token
        const token = generateToken({
            id: user.UserID.toString(),
            email: user.Email,
            role: (user as any).role.RoleName
        });

        const response: ApiResponse = {
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user.UserID,
                    username: user.Username,
                    email: user.Email,
                    role: (user as any).role.RoleName
                }
            }
        };

        res.json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error during login:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Login failed.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};