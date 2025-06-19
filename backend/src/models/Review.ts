import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ReviewAttributes } from '../types';
import Hotel from './Hotel';
 
class Review extends Model<ReviewAttributes> implements ReviewAttributes {
    public ReviewID!: number;
    public HotelID!: number;
    public ReviewerName!: string;
    public ReviewSubject!: string;
    public ReviewContent!: string;
    public ReviewDate!: Date;
    public OverallRating!: number;
    public CleanlinessRating!: number;
    public LocationRating!: number;
    public ServiceRating!: number;
    public ValueRating!: number;
    public FoodBeverage!: number;
    public SleepQuality!: number;
    public InternetQuality!: number;
    public AmenitiesRating!: number;
    public helpfulYes!: number;
    public helpfulNo!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
 
Review.init(
    {
        ReviewID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        HotelID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Hotel,
                key: 'GlobalPropertyID'
            }
        },
        ReviewerName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        ReviewSubject: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        ReviewContent: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        ReviewDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        OverallRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 10.0
            }
        },
        CleanlinessRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 10.0
            }
        },
        LocationRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 10.0
            }
        },
        ServiceRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 10.0
            }
        },
        ValueRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 10.0
            }
        },
        FoodBeverage: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        validate: {
            min: 1.0,
            max: 10.0
        }
        },
        SleepQuality: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        validate: {
            min: 1.0,
            max: 10.0
        }
        },
        InternetQuality: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        validate: {
            min: 1.0,
            max: 10.0
        }
        },
        AmenitiesRating: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        validate: {
            min: 1.0,
            max: 10.0
        }
        },
        helpfulYes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        },
        helpfulNo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        },
 
 
    },
    {
        sequelize,
        modelName: 'Review',
        tableName: 'Reviews',
        timestamps: true,
        indexes: [
            {
                fields: ['HotelID']
            },
            {
                fields: ['OverallRating']
            },
            {
                fields: ['ReviewDate']
            }
        ]
    }
);
 
//many-to-one relationship
Review.belongsTo(Hotel, { foreignKey: 'HotelID', targetKey: 'GlobalPropertyID', as: 'hotel' });
Hotel.hasMany(Review, { foreignKey: 'HotelID', sourceKey: 'GlobalPropertyID', as: 'reviews' });
 
export default Review;