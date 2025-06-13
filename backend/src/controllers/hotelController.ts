import { Request, Response } from 'express';
import db from '../models';
import { ApiResponse, HotelAttributes, HotelCreationAttributes, HotelRequiredFields } from '../types';
import sequelize from '../config/database';

const { Hotel, City, Region } = db;

//GET /hotels (public)
export const getAllHotels = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        //basic pagination to handle large datasets
        //extract page number from query params, default to 1
        const page = parseInt(req.query.page as string) || 1;

        //extract limit of items per page from query params, default 50
        const limit = parseInt(req.query.limit as string) || 50;

        //calculate offset(how many records to skip) base on current page and limit
        const offset = (page - 1) * limit;

        //limit maximum results per page to prevent overload
        const maxLimit = 200;
        
        //ensure the requested limit doesn't exceed maxLimit
        const finalLimit = Math.min(limit, maxLimit);


        //sequelize query to fetch records, count total records and apply pagination
        const hotels = await Hotel.findAndCountAll({
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
                }
            ],
            limit: finalLimit,
            offset,
            order: [['GlobalPropertyName', 'ASC']]
        });

        //calculate total number of pages by dividing total count by items per page, rounding up
        const totalPages = Math.ceil(hotels.count / finalLimit);


        const response: ApiResponse = {
            success: true,
            data: hotels.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: hotels.count,
                itemsPerPage: finalLimit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching hotels:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve hotels.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


//GET /hotels/:name (public)
export const getHotelByName = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { name } = req.params;
        
        //verify if the name from request is empty or only whitespaces
        if (!name || name.trim() === '') {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel name is required.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //sequelize query to return the record that matches where condition
        const hotel = await Hotel.findOne({
            where: {
                GlobalPropertyName: name.trim()
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
                }
            ]
        });

        if (!hotel) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel not found.',
                message: `No hotel found with name: ${name}.`
            };
            res.status(404).json(errorResponse);
            return;
        }

        const response: ApiResponse = {
            success: true,
            data: hotel
        };

        res.json(response);
    } catch (error) {
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


//POST /hotels (protected)
export const createHotel = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        //extract req body and type it as Attributes
        const hotelData = req.body as HotelAttributes;

        //define requiredFields array using TypeScript keyof to ensure field names match interface
        const requiredFields: (keyof HotelRequiredFields)[] = [
            'SourcePropertyID',
            'GlobalPropertyName',
            'GlobalChainCode',
            'PropertyAddress1',
            'PrimaryAirportCode',
            'CityID',
            'PropertyStateProvinceID',
            'PropertyZipPostal',
            'PropertyPhoneNumber',
            'SabrePropertyRating',
            'PropertyLatitude',
            'PropertyLongitude',
            'SourceGroupCode'
        ];

        //filter required fields to find missing ones
        const missingFields = requiredFields
            .filter(field => !hotelData[field] && hotelData[field] !== 0)   //check if field is falsy but allow 0
            .map(field => String(field));   //convert field names to string for response

        if (missingFields.length > 0) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Missing required fields',
                message: `Required fields: ${missingFields.join(', ')}`
            };
            res.status(400).json(errorResponse);
            return;
        }

        //destructure hotelData object to extract individual fields
        const {
            SourcePropertyID,
            GlobalPropertyName,
            GlobalChainCode,
            PropertyAddress1,
            PropertyAddress2,
            PrimaryAirportCode,
            CityID,
            PropertyStateProvinceID,
            PropertyZipPostal,
            PropertyPhoneNumber,
            PropertyFaxNumber,
            SabrePropertyRating,
            PropertyLatitude,
            PropertyLongitude,
            SourceGroupCode
        } = hotelData;

        //look up the city and region by PK to make sure they exist in database
        const city = await City.findByPk(CityID, { transaction });
        const region = await Region.findByPk(PropertyStateProvinceID, { transaction });

        if (!city) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid CityID',
                message: `City with ID ${CityID} does not exist`
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!region) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid PropertyStateProvinceID',
                message: `Region with ID ${PropertyStateProvinceID} does not exist`
            };
            res.status(400).json(errorResponse);
            return;
        }

        //create new hotel record within transaction
        const newHotel = await Hotel.create({
            SourcePropertyID: SourcePropertyID!,
            GlobalPropertyName: GlobalPropertyName!,
            GlobalChainCode: GlobalChainCode!,
            PropertyAddress1: PropertyAddress1!,
            PropertyAddress2: PropertyAddress2 || null,
            PrimaryAirportCode: PrimaryAirportCode!,
            CityID: CityID!,
            PropertyStateProvinceID: PropertyStateProvinceID!,
            PropertyZipPostal: PropertyZipPostal!,
            PropertyPhoneNumber: PropertyPhoneNumber!,
            PropertyFaxNumber: PropertyFaxNumber || null,
            SabrePropertyRating: typeof SabrePropertyRating === 'string' ? parseFloat(SabrePropertyRating) : SabrePropertyRating!,
            PropertyLatitude: typeof PropertyLatitude === 'string' ? parseFloat(PropertyLatitude) : PropertyLatitude!,
            PropertyLongitude: typeof PropertyLongitude === 'string' ? parseFloat(PropertyLongitude) : PropertyLongitude!,
            SourceGroupCode: SourceGroupCode!
        } as HotelCreationAttributes, { transaction });


        //fetch the created hotel with relationships
        const createdHotel = await Hotel.findByPk(newHotel.GlobalPropertyID, {
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
                }
            ],
            transaction
        });

        await transaction.commit();

        const response: ApiResponse = {
            success: true,
            message: 'Hotel created successfully.',
            data: createdHotel
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction?.rollback();

        console.error('Error creating hotel:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to create hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


//PUT /hotels/:id (protected)
export const updateHotel = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const { id } = req.params;
        const hotelId = parseInt(id);

        if (isNaN(hotelId)) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid hotel ID.',
                message: 'Hotel ID must be a valid number.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //extract and type req body as HotelAttributes
        const hotelData = req.body as HotelAttributes;

        //search for hotel by primary key
        const hotel = await Hotel.findByPk(hotelId, { transaction });
        
        if (!hotel) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel not found.',
                message: `No hotel found with ID: ${hotelId}`
            };
            res.status(404).json(errorResponse);
            return;
        }

        //destructure the two FK from req body
        const { CityID, PropertyStateProvinceID } = hotelData;
        

        if (CityID && CityID !== hotel.CityID) {
            const city = await City.findByPk(CityID, { transaction });
            if (!city) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid CityID',
                    message: `City with ID ${CityID} does not exist`
                };
                res.status(400).json(errorResponse);
                return;
            }
        }


        if (PropertyStateProvinceID && PropertyStateProvinceID !== hotel.PropertyStateProvinceID) {
            const region = await Region.findByPk(PropertyStateProvinceID, { transaction });
            if (!region) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid PropertyStateProvinceID',
                    message: `Region with ID ${PropertyStateProvinceID} does not exist.`
                };
                res.status(400).json(errorResponse);
                return;
            }
        }

        //update the hotel
        await hotel.update(hotelData, {transaction});

        //fetch updated hotel with relationships
        const updatedHotel = await Hotel.findByPk(hotelId, {
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
                }
            ],
            transaction
        });

        await transaction.commit();

        const response: ApiResponse = {
            success: true,
            message: 'Hotel updated successfully.',
            data: updatedHotel
        };

        res.json(response);
    } catch (error) {
        transaction?.rollback();
        console.error('Error updating hotel:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to update hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


//DELETE /hotels/:id (protected)
export const deleteHotel = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const hotelId = parseInt(id);

        if (isNaN(hotelId)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid hotel ID',
                message: 'Hotel ID must be a valid number'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const hotel = await Hotel.findByPk(hotelId, {
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
                }
            ]
        });

        if (!hotel) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel not found',
                message: `No hotel found with ID: ${hotelId}`
            };
            res.status(404).json(errorResponse);
            return;
        }

        //store hotel data before deletion for response
        const deletedHotelData = hotel.toJSON();

        await hotel.destroy();

        const response: ApiResponse = {
            success: true,
            message: 'Hotel deleted successfully',
            data: deletedHotelData
        };

        res.json(response);
    } catch (error) {
        console.error('Error deleting hotel:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to delete hotel',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
        res.status(500).json(errorResponse);
    }
};