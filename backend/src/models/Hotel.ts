import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { HotelAttributes, HotelCreationAttributes } from "../types";
import City from "./City";
import Region from "./Region";

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

export default Hotel;