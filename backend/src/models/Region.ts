import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { RegionAttributes } from "../types";

class Region extends Model<RegionAttributes> implements RegionAttributes {
    public PropertyStateProvinceID!: number;
    public PropertyStateProvinceName!: string;
}

Region.init(
    {
        PropertyStateProvinceID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        PropertyStateProvinceName: {
            type: DataTypes.STRING(100),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Region',
        tableName: 'Regions',
        timestamps: false
    }
);

export default Region;