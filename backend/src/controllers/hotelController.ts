import { Request, Response } from 'express';
import db from '../models';
import { ApiResponse, HotelAttributes, HotelCreationAttributes, HotelRequiredFields } from '../types';
import { Transaction, Op, literal } from 'sequelize';
import { UserPayload } from '../types'; 

const { Hotel, City, Region, User, Role, sequelize } = db;

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}


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
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['Username', 'Email']
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
    const transaction: Transaction = await sequelize.transaction();

    try {
        //extract req body and type it as Attributes
        const hotelData = req.body as HotelAttributes;

        //define requiredFields array using TypeScript keyof to ensure field names match interface
        //removed SourcePropertyID from required fields since it will be auto-generated
        const requiredFields: (keyof HotelRequiredFields)[] = [
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

        if (!hotelData.ManagerUsername || hotelData.ManagerUsername.trim() === '') {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Manager username is required.',
                message: 'Please specify a valid manager username for the hotel.'
            };
            res.status(400).json(errorResponse);
            return;
        }

        //filter required fields to find missing ones
        const missingFields = requiredFields
            .filter(field => !hotelData[field] && hotelData[field] !== 0)   //check if field is falsy but allow 0
            .map(field => String(field));   //convert field names to string for response

        if (missingFields.length > 0) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Missing required fields.',
                message: `Required fields: ${missingFields.join(', ')}`
            };
            res.status(400).json(errorResponse);
            return;
        }

        const manager = await User.findOne({
            where: { Username: hotelData.ManagerUsername.trim() },
            include: [{
                model: Role,
                as: 'role',
                where: { RoleName: 'hotel_manager' }
            }],
            transaction
        });

        if (!manager) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid manager.',
                message: `Manager '${hotelData.ManagerUsername}' not found or doesn't have manager role.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        //destructure hotelData object to extract individual fields
        //removed SourcePropertyID from destructuring since it will be auto-generated
        const {
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
                error: 'Invalid CityID.',
                message: `City with ID ${CityID} does not exist.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!region) {
            await transaction.rollback();
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid PropertyStateProvinceID.',
                message: `Region with ID ${PropertyStateProvinceID} does not exist.`
            };
            res.status(400).json(errorResponse);
            return;
        }

        //generate a unique SourcePropertyID
        //you can customize this logic based on your requirements
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const generatedSourcePropertyID = `HTL-${timestamp}-${randomSuffix}`;

        //create new hotel record within transaction
        //using the auto-generated SourcePropertyID
        const newHotel = await Hotel.create({
            SourcePropertyID: generatedSourcePropertyID,
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
            SourceGroupCode: SourceGroupCode!,
            ManagerUsername: hotelData.ManagerUsername.trim()
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
            message: 'Hotel created successfully.',
            data: createdHotel
        };

        res.status(201).json(response);
    } catch (error) {
        await transaction.rollback();

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
    const transaction: Transaction = await sequelize.transaction();

    try {
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

        //validate manager
        if (hotelData.ManagerUsername && hotelData.ManagerUsername !== hotel.ManagerUsername) {
            const manager = await User.findOne({
                where: { Username: hotelData.ManagerUsername.trim() },
                include: [{
                    model: Role,
                    as: 'role',
                    where: { RoleName: 'hotel_manager' }
                }],
                transaction
            });

            if (!manager) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid manager.',
                    message: `Manager '${hotelData.ManagerUsername}' not found or doesn't have manager role.`
                };
                res.status(400).json(errorResponse);
                return;
            }
        }

        //destructure the two FK from req body
        const { CityID, PropertyStateProvinceID } = hotelData;
        

        if (CityID && CityID !== hotel.CityID) {
            const city = await City.findByPk(CityID, { transaction });
            if (!city) {
                await transaction.rollback();
                const errorResponse: ApiResponse = {
                    success: false,
                    error: 'Invalid CityID.',
                    message: `City with ID ${CityID} does not exist.`
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
            message: 'Hotel updated successfully.',
            data: updatedHotel
        };

        res.json(response);
    } catch (error) {
        transaction.rollback();
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
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['Username', 'Email']
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
            message: 'Hotel deleted successfully.',
            data: deletedHotelData
        };

        res.json(response);
    } catch (error) {
        console.error('Error deleting hotel:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to delete hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


export const getHotelsWithReviews = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const hotels = await db.Review.findAll({
      attributes: [
        [sequelize.col('hotel.GlobalPropertyID'), 'id'],
        [sequelize.col('hotel.GlobalPropertyName'), 'name'],
        [sequelize.col('hotel->city.CityName'), 'city'],
        [sequelize.fn('AVG', sequelize.col('OverallRating')), 'rating'],
        [sequelize.fn('COUNT', sequelize.col('ReviewID')), 'reviewCount']
      ],
      include: [
        {
          model: db.Hotel,
          as: 'hotel',
          attributes: [],
          include: [
            {
              model: db.City,
              as: 'city',
              attributes: []
            }
          ]
        }
      ],
      group: [
        'hotel.GlobalPropertyID',
        'hotel.GlobalPropertyName',
        'hotel->city.CityName'
      ],
      offset,
      limit,
      raw: true
    });

    const formattedHotels = hotels.map((hotel: any) => ({
      ...hotel,
      rating: hotel.rating ? parseFloat(hotel.rating) : null,
      reviewCount: Number(hotel.reviewCount)
    }));

    res.json({ success: true, data: formattedHotels });
  } catch (error) {
    console.error('Error fetching hotels with reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hotels with reviews.',
      message: error instanceof Error ? error.message : 'Unknown error.'
    });
  }
};


export const getHotelDetailsWithReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const hotelId = parseInt(req.params.id);
    if (isNaN(hotelId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid hotel ID',
        message: 'ID must be a number.'
      });
      return;
    }
 
    const hotel = await db.Hotel.findByPk(hotelId, {
      include: [
        { model: db.City, as: 'city', attributes: ['CityName', 'Country'] },
        { model: db.Region, as: 'region', attributes: ['PropertyStateProvinceName'] },
        { model: db.User, as: 'manager', attributes: ['Username', 'Email'] }
      ]
    });
 
    if (!hotel) {
      res.status(404).json({
        success: false,
        error: 'Hotel not found.'
      });
      return;
    }
 
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
 
    const { count, rows: reviews } = await db.Review.findAndCountAll({
      where: { HotelID: hotelId },
      limit,
      offset,
      order: [['ReviewDate', 'DESC']]
    });
 
    res.status(200).json({
      success: true,
      data: {
        hotel,
        reviews
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};


export const getHotelById = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const hotelId = parseInt(id);

        if (isNaN(hotelId)) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Invalid hotel ID.',
                message: 'Hotel ID must be a valid number.'
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
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['Username', 'Email']
                }
            ]
        });

        if (!hotel) {
            const errorResponse: ApiResponse = {
                success: false,
                error: 'Hotel not found.',
                message: `No hotel found with ID: ${hotelId}.`
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
        console.error('Error fetching hotel by ID:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve hotel.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};


export const getHotelsWithReviewsAndManagers = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const hotels = await db.Review.findAll({
      attributes: [
        [sequelize.col('hotel.GlobalPropertyID'), 'id'],
        [sequelize.col('hotel.GlobalPropertyName'), 'name'],
        [sequelize.col('hotel->city.CityName'), 'city'],
        [sequelize.col('hotel.ManagerUsername'), 'manager'],
        [sequelize.fn('AVG', sequelize.col('OverallRating')), 'rating'],
        [sequelize.fn('COUNT', sequelize.col('ReviewID')), 'reviewCount']
      ],
      include: [
        {
          model: db.Hotel,
          as: 'hotel',
          attributes: [],
          include: [
            {
              model: db.City,
              as: 'city',
              attributes: []
            }
          ]
        }
      ],
      group: [
        'hotel.GlobalPropertyID',
        'hotel.GlobalPropertyName',
        'hotel->city.CityName',
        'hotel.ManagerUsername'
      ],
      offset,
      limit,
      raw: true
    });

    const formattedHotels = hotels.map((hotel: any) => ({
      ...hotel,
      rating: hotel.rating ? parseFloat(hotel.rating) : null,
      reviewCount: Number(hotel.reviewCount)
    }));

    res.json({ success: true, data: formattedHotels });
  } catch (error) {
    console.error('Error fetching hotels with reviews and managers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hotels with reviews and managers.',
      message: error instanceof Error ? error.message : 'Unknown error.'
    });
  }
};


export const getAllCities = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const search = req.query.search as string || '';
        const limit = parseInt(req.query.limit as string) || 50;
        
        const whereClause = search ? {
            [Op.or]: [
                { CityName: { [Op.iLike]: `%${search}%` } },
                { Country: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};

        const cities = await City.findAll({
            where: whereClause,
            attributes: ['CityID', 'CityName', 'Country'],
            order: [['CityName', 'ASC'], ['Country', 'ASC']],
            limit
        });

        const response: ApiResponse = {
            success: true,
            data: cities
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching cities:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve cities.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

export const getAllStatesProvinces = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const search = req.query.search as string || '';
        const limit = parseInt(req.query.limit as string) || 50;
        
        const whereClause = search ? {
            PropertyStateProvinceName: { [Op.iLike]: `%${search}%` }
        } : {};

        const statesProvinces = await Region.findAll({
            where: whereClause,
            attributes: ['PropertyStateProvinceID', 'PropertyStateProvinceName'],
            order: [['PropertyStateProvinceName', 'ASC']],
            limit
        });

        const response: ApiResponse = {
            success: true,
            data: statesProvinces
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching states/provinces:', error);
        const errorResponse: ApiResponse = {
            success: false,
            error: 'Failed to retrieve states/provinces.',
            message: error instanceof Error ? error.message : 'Unknown error occurred.'
        };
        res.status(500).json(errorResponse);
    }
};

export const getHotelsForManager = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const managerUsername = req.user?.username;

    if (!managerUsername) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Manager username not found in token.'
      });
      return;
    }

    const hotels = await Hotel.findAll({
      where: { ManagerUsername: managerUsername },
      include: [
        { model: City, as: 'city', attributes: ['CityName'] },
        { model: Region, as: 'region', attributes: ['PropertyStateProvinceName'] }
      ],
      attributes: {
        include: [
          [
            literal(`(
              SELECT AVG("OverallRating")
              FROM "Reviews"
              WHERE "Reviews"."HotelID" = "Hotel"."GlobalPropertyID"
            )`),
            'rating'
          ],
          [
            literal(`(
              SELECT COUNT(*)
              FROM "Reviews"
              WHERE "Reviews"."HotelID" = "Hotel"."GlobalPropertyID"
            )`),
            'reviewCount'
          ]
        ]
      },
      raw: true,
      nest: true
    });

    // transformă datele pentru frontend
    const formatted = hotels.map((h: any) => ({
      id: h.GlobalPropertyID,
      name: h.GlobalPropertyName,
      city: h.city?.CityName ?? 'N/A',
      rating: h.rating ? parseFloat(h.rating) : null,
      reviewCount: Number(h.reviewCount),
      DistanceToTheAirport: h.DistanceToTheAirport ?? null,
      RoomsNumber: h.RoomsNumber ?? null,
      HotelStars: h.HotelStars ?? null,
      NumberOfFloors: h.NumberOfFloors ?? null
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching hotels for manager:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hotels.',
      message: error instanceof Error ? error.message : 'Unknown error.'
    });
  }
};
