import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { CityAttributes } from '../types';

class City extends Model<CityAttributes> implements CityAttributes {
    public CityID!: number;
    public CityName!: string;
    public Country!: string;
}

City.init(
    {
        CityID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        CityName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        Country: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'City',
        tableName: 'Cities',
        timestamps: false
    }
);

export default City;