import { Request, Response } from 'express';
import db from '../models';
import { ApiResponse } from '../types';
import { Transaction } from 'sequelize';

const { Hotel, City, Region, User, Role, sequelize } = db;

//GET /my-hotels (managers only)
export const getMyHotels = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        if (!req.user) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Authentication required.'
            };
            res.status(401).json(errorResponse);
            return;
        }

        //basic pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        const maxLimit = 200;
        const finalLimit = Math.min(limit, maxLimit);

        //find user's username from their ID
        const currentUser = await User.findByPk(req.user.id);
        if (!currentUser) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'User not found'
            };
            res.status(404).json(errorResponse);
            return;
        }

        //find hotels managed by this user
        const userHotels = await Hotel.findAndCountAll({
            where: { 
                ManagerUsername: currentUser.Username 
            },
            include: [
                {
                    model: City,
                    as: 'city',
                    attributes: ['CityName', 'Country']
                },
                {
                    model: Region,
                    as: 'region',
                    attributes: ['PropertyStateProvinceName']
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['Username', 'Email']
                }
            ],
            limit: finalLimit,
            offset,
            order: [['GlobalPropertyName', 'ASC']]
        });

        const totalPages = Math.ceil(userHotels.count / finalLimit);

        const response: ApiResponse = {
            success: true,
            data: userHotels.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: userHotels.count,
                itemsPerPage: finalLimit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching manager hotels:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve your hotels.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

//PUT /reassign-hotel/:hotelId (admin only)
export const reassignHotel = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const { hotelId } = req.params;
        const { newManagerUsername } = req.body;
        const hotelIdNum = parseInt(hotelId);

        if (isNaN(hotelIdNum)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid hotel ID.',
                message: 'Hotel ID must be valid.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!newManagerUsername) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Manager username is required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //verify hotel exists
        const hotel = await Hotel.findByPk(hotelIdNum, { transaction });

        if (!hotel) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel not found.',
                message: `No hotel found with ID: ${hotelIdNum}`
            };
            res.status(404).json(errorResponse);
            return;
        }

        //verify new manager exists and has manager role
        const newManager = await User.findOne({
            where: { Username: newManagerUsername },
            include: [{
                model: Role,
                as: 'role',
                where: { RoleName: 'hotel_manager' }
            }],
            transaction
        });

        if (!newManager) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid manager.',
                message: `Manager '${newManagerUsername}' not found or doesn't have manager role.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        const oldManagerUsername = hotel.ManagerUsername;

        //reassign hotel to new manager
        await hotel.update({ ManagerUsername: newManagerUsername }, { transaction });

        //fetch updated hotel with relationships
        const updatedHotel = await Hotel.findByPk(hotelIdNum, {
            include: [
                {
                    model: City,
                    as: 'city',
                    attributes: ['CityName', 'Country']
                },
                {
                    model: Region,
                    as: 'region',
                    attributes: ['PropertyStateProvinceName']
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['Username', 'Email']
                }
            ],
            transaction
        });

        await transaction.commit();

        const response: ApiResponse = {
            success: true,
            message: 'Hotel reassigned successfully.',
            data: {
                hotel: updatedHotel,
                previousManager: oldManagerUsername,
                newManager: newManagerUsername
            }
        };

        res.json(response);
    } catch (error) {
        await transaction.rollback();

        console.error('Error reassigning hotel:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to reassign hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};