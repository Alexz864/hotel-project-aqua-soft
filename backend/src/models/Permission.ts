import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { PermissionAttributes } from '../types';
import Role from './Role';

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
    public PermissionID!: number;
    public RoleID!: number;
    public Resource!: string;
    public Action!: string;
}

Permission.init(
    {
        PermissionID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Role,
                key: 'RoleID'
            }
        },
        Resource: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['hotels', 'reviews', 'users', 'own_hotels']]
            }
        },
        Action: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [['read', 'write']]
            }
        }
    },
    {
        sequelize,
        modelName: 'Permission',
        tableName: 'Permissions',
        timestamps: false,
        //prevent duplicate permissions
        indexes: [
            {
                unique: true,
                fields: ['RoleID', 'Resource', 'Action']
            }
        ]
    }
);

//many-to-one relationship
Permission.belongsTo(Role, { foreignKey: 'RoleID', as: 'role' });
Role.hasMany(Permission, { foreignKey: 'RoleID', as: 'permissions' });

export default Permission;