import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import db from "../models";
import { ApiResponse, UserCreationAttributes } from "../types";

const { User, Role, sequelize } = db;

//GET /users (admin only)
export const getAllUsers = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        //basic pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page -1 ) * limit;
        const maxLimit = 200;
        const finalLimit = Math.min(limit, maxLimit);

        //search filter
        const search = req.query.search as string;
        let whereClause = {};

        if (search) {
            whereClause = {
                [Op.or]: [
                    { Username: { [Op.iLike]: `%${search}%` }},
                    { Email: { [Op.iLike]: `%${search}%` }}
                ]
            }
        }

        const users = await User.findAndCountAll({
            where: whereClause,
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName']
            }],
            attributes: ['UserID', 'Username', 'Email'],
            limit: finalLimit,
            offset,
            order: [['Username', 'ASC']]
        });

        const totalPages = Math.ceil(users.count / finalLimit);

        const response: ApiResponse = {
            success: true,
            data: users.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: users.count,
                itemsPerPage: finalLimit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching users:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve users.',
            message: error instanceof Error ? error.message: 'Unknown error ocurred.'
        };
        res.status(500).json(errorResponse);
    }
}

//GET /admin/users/:id (admin only)
export const getUserById = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if(isNaN(userId)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid user ID.',
                message: 'User ID must be valid.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName']
            }],
            attributes: ['UserID', 'Username', 'Email']
        });

        if(!user) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'User not found.',
                message: `No user found with ID: ${userId}.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        const response:ApiResponse = {
            success: true,
            data: user
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching user:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to get user.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//POST /users (admin only)
export const createUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { username, password, email, roleName } = req.body;

        //validate required fields
        if (!username || !password || !email || !roleName) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Missing required fields.',
                message: 'Username, password, email, and role are required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //validate username length
        if (username.length < 3 || username.length > 50) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid username.',
                message: 'Username must be between 3 and 50 characters.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //validate password length
        if (password.length < 6) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid password.',
                message: 'Password must be at least 6 characters long.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //validate email format (basic check)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid email.',
                message: 'Please provide a valid email address.'
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
                ],
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

        //find role by name
        const role = await Role.findOne({
            where: { RoleName: roleName },
            transaction
        });

        if (!role) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid role.',
                message: 'Role must be one of: traveler, hotel_manager, data_operator, admin.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //create new user
        const newUser = await User.create({
            Username: username,
            Password: password,
            Email: email,
            RoleID: role.RoleID
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
            message: 'User created successfully.',
            data: createdUser
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error creating user:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to create user.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//PUT /users/:id (admin only)
export const updateUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { username, email, password } = req.body;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid user ID.',
                message: 'User ID must be valid.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //find user
        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'User not found.',
                message: `No user found with ID: ${userId}.`
            };
            res.status(404).json(errorResponse);
            return;
        }

        const updateData: any = {};

        //validate and add username
        if (username !== undefined) {
            if (username.length < 3 || username.length > 50) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid username.',
                    message: 'Username must be between 3 and 50 characters.'
                };
                res.status(400).json(errorResponse);
                return;
            }

            //check if username is already taken
            const existingUser = await User.findOne({
                where: {
                    Username: username,
                    UserID: { [Op.ne]: userId }
                },
                transaction
            });

            if (existingUser) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Username already taken.',
                    message: 'This username is already in use.'
                };
                res.status(400).json(errorResponse);
                return;
            }

            updateData.Username = username;
        }

        //validate and add email
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid email.',
                    message: 'Please provide a valid email address.'
                };
                res.status(400).json(errorResponse);
                return;
            }

            //check if email is already taken
            const existingUser = await User.findOne({
                where: {
                    Email: email,
                    UserID: { [Op.ne]: userId }
                },
                transaction
            });

            if (existingUser) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Email already taken.',
                    message: 'This email is already in use.'
                };
                res.status(400).json(errorResponse);
                return;
            }

            updateData.Email = email;
        }

        //validate and add password
        if (password !== undefined) {
            if (password.length < 6) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid password.',
                    message: 'Password must be at least 6 characters long.'
                };
                res.status(400).json(errorResponse);
                return;
            }

            updateData.Password = password;
        }

        //check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'No data to update.',
                message: 'Please provide at least one field to update (username, email, or password).'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //update user
        await user.update(updateData, { transaction });

        //fetch updated user with role info
        const updatedUser = await User.findByPk(userId, {
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
            message: 'User updated successfully.',
            data: updatedUser
        };

        res.json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error updating user:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to update user.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//PUT /users/:id/role (admin only)
export const updateUserRole = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { roleName } = req.body;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid user ID.',
                message: 'User ID must be valid.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!roleName) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Role is required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //find user (using transaction)
        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'User not found.',
                message: `No user found with ID: ${userId}.`
            };
            res.status(404).json(errorResponse);
            return;
        }

        //find role (using transaction)
        const role = await Role.findOne({
            where: { RoleName: roleName },
            transaction
        });

        if (!role) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid role.',
                message: 'Role must be one of: traveler, hotel_manager, data_operator, admin.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //prevent admin from demoting themselves
        if (req.user && parseInt(req.user.id) === userId && req.user.role === 'admin' && roleName !== 'admin') {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Cannot demote yourself.',
                message: 'Administrators cannot change their own role.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //update user role (using transaction)
        await user.update({ RoleID: role.RoleID }, { transaction });

        //fetch updated user with role info (using transaction)
        const updatedUser = await User.findByPk(userId, {
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
            message: 'User role updated successfully.',
            data: updatedUser
        };

        res.json(response);
    } catch (error) {
        await transaction.rollback();
        
        console.error('Error updating user role:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to update user role.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//DELETE /users/:id (admin only)
export const deleteUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid user ID.',
                message: 'User ID must be valid.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //prevent admin from deleting themselves
        if (req.user && parseInt(req.user.id) === userId) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Cannot delete yourself.',
                message: 'You cannot delete your own account.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleName']
            }],
            attributes: ['UserID', 'Username', 'Email']
        });

        if (!user) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'User not found.',
                message: `No user found with ID: ${userId}.`
            };
            res.status(404).json(errorResponse);
            return;
        }

        //check if user is managing any hotels
        const managedHotelsCount = await db.Hotel.count({
            where: { ManagerUsername: (user as any).Username }
        });

        if (managedHotelsCount > 0) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Cannot delete user.',
                message: `User is currently managing ${managedHotelsCount} hotels. Please reassign these hotels first.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        //store user data before deletion
        const deletedUserData = user.toJSON();

        await user.destroy({ transaction });

        await transaction.commit();

        const response: ApiResponse = {
            success: true,
            message: 'User deleted successfully.',
            data: deletedUserData
        };

        res.json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error deleting user:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to delete user.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};