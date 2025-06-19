import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { HotelAttributes, HotelCreationAttributes } from "../types";
import City from "./City";
import Region from "./Region";
import User from "./User";
 
class Hotel extends Model<HotelAttributes, HotelCreationAttributes> implements HotelAttributes {
    public GlobalPropertyID!: number;
    public SourcePropertyID!: string;
    public GlobalPropertyName!: string;
    public GlobalChainCode!: string;
    public PropertyAddress1!: string;
    public PropertyAddress2?: string;
    public PrimaryAirportCode!: string;
    public CityID!: number;
    public PropertyStateProvinceID!: number;
    public PropertyZipPostal!: string;
    public PropertyPhoneNumber!: string;
    public PropertyFaxNumber?: string;
    public SabrePropertyRating!: number;
    public PropertyLatitude!: number;
    public PropertyLongitude!: number;
    public SourceGroupCode!: string;
    public ManagerUsername!: string;
    //for hotels dashboard
    public DistanceToTheAirport?: number;
    public RoomsNumber?: number;
    public FloorsNumber?: number;
    public HotelStars?: number;
}
 
Hotel.init(
    {
        GlobalPropertyID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
 
        SourcePropertyID: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
 
        GlobalPropertyName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
 
        GlobalChainCode: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
 
        PropertyAddress1: {
            type: DataTypes.TEXT,
            allowNull: false
        },
 
        PropertyAddress2: {
            type: DataTypes.TEXT,
            allowNull: true
        },
 
        PrimaryAirportCode: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
 
        CityID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: City,
                key: 'CityID'
            }
        },
 
        PropertyStateProvinceID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Region,
                key: 'PropertyStateProvinceID'
            }
        },
 
        PropertyZipPostal: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
 
        PropertyPhoneNumber: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
 
        PropertyFaxNumber: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
 
        SabrePropertyRating: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: false
        },
 
        PropertyLatitude: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false
        },
 
        PropertyLongitude: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false
        },
 
        SourceGroupCode: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
 
        ManagerUsername: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: {
                model: User,
                key: 'Username'
            }
        },
 
        DistanceToTheAirport: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
 
        RoomsNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            }
        },
 
        FloorsNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            }
        },
 
        HotelStars: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 3,
            validate: {
                min: 1,
                max: 5
            }
        }
 
    },
    {
        sequelize,
        modelName: 'Hotel',
        tableName: 'Hotels',
        timestamps: false
    }
);
 
//many-to-one relationship
Hotel.belongsTo(City, { foreignKey: 'CityID', as: 'city' });
City.hasMany(Hotel, { foreignKey: 'CityID', as: 'hotels' });
 
//many-to-one relationship
Hotel.belongsTo(Region, { foreignKey: 'PropertyStateProvinceID', as: 'region' });
Region.hasMany(Hotel, { foreignKey: 'PropertyStateProvinceID', as: 'hotels' });
 
//many-to-one relationship with managers
Hotel.belongsTo(User, { foreignKey: 'ManagerUsername', targetKey: 'Username', as: 'manager' });
User.hasMany(Hotel, { foreignKey: 'ManagerUsername', sourceKey: 'Username', as: 'managedHotels' });
 
export default Hotel;