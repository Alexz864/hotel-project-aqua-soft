import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ReviewAttributes } from '../types';
import Hotel from './Hotel';

class Review extends Model<ReviewAttributes> implements ReviewAttributes {
    public ReviewID!: number;
    public GlobalPropertyID!: number;
    public ReviewerName!: string;
    public ReviewTitle!: string;
    public ReviewContent!: string;
    public ValueRating!: number;
    public LocationRating!: number;
    public ServiceRating!: number;
    public RoomsRating!: number;
    public CleanlinessRating!: number;
    public SleepQualityRating!: number;
}

Review.init(
    {
        ReviewID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        GlobalPropertyID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Hotel,
                key: 'GlobalPropertyID'
            }
        },
        ReviewerName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        ReviewTitle: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        ReviewContent: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        ValueRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        LocationRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        ServiceRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        RoomsRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        CleanlinessRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        },
        SleepQualityRating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            }
        }
    },
    {
        sequelize,
        modelName: 'Review',
        tableName: 'Reviews',
        timestamps: false
    }
);

//many-to-one relationship
Review.belongsTo(Hotel, { foreignKey: 'GlobalPropertyID', as: 'hotel' });
Hotel.hasMany(Review, { foreignKey: 'GlobalPropertyID', as: 'reviews' });

export default Review;