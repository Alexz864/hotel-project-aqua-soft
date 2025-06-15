import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { UserAttributes, UserCreationAttributes } from '../types';
import Role from './Role';
import bcrypt from 'bcryptjs';

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public UserID!: number;
    public Username!: string;
    public Password!: string;
    public Email!: string;
    public RoleID!: number;

    //method to validate password
    public validatePassword = async(password: string): Promise<boolean> => {
        return await bcrypt.compare(password, this.Password);
    }
}

User.init(
    {
        UserID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Username: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                notEmpty: true
            }
        },
        Password: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [6, 100]
            }
        },
        Email: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Role,
                key: 'RoleID'
            }
        }
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        timestamps: false,
        hooks: {
            //use bcrypt to hash the password
            beforeCreate: async (user: User) => {
                const salt = await bcrypt.genSalt(10);
                user.Password = await bcrypt.hash(user.Password, salt);
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('Password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.Password = await bcrypt.hash(user.Password, salt);
                }
            }
        }
    }
);

//many-to-one relationship
User.belongsTo(Role, { foreignKey: 'RoleID', as: 'role' });
Role.hasMany(User, { foreignKey: 'RoleID', as: 'users' });

export default User;