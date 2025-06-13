import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { RoleAttributes } from '../types';

class Role extends Model<RoleAttributes> implements RoleAttributes {
    public RoleID!: number;
    public RoleName!: string;
}

Role.init(
    {
        RoleID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        RoleName: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                isIn: [['traveler', 'hotel_manager', 'data_operator', 'admin']]
            }
        }
    },
    {
        sequelize,
        modelName: 'Role',
        tableName: 'Roles',
        timestamps: false
    }
);

export default Role;