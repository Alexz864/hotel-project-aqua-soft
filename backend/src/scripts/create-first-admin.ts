import db from '../models';
import { UserCreationAttributes } from '../types';

const { User, Role } = db;

//create the first admin user
export const createFirstAdmin = async (): Promise<void> => {
    try {
        //check if admin already exists
        const existingAdmin = await User.findOne({
            include: [{
                model: Role,
                as: 'role',
                where: { RoleName: 'admin' }
            }]
        });

        if (existingAdmin) {
            console.log(`Admin user already exists: ${existingAdmin.Username}`);
            console.log(`Email: ${existingAdmin.Email}`);
            return;
        }

        //find admin role
        const adminRole = await Role.findOne({
            where: { RoleName: 'admin' }
        });

        if (!adminRole) {
            console.log('Admin role not found! Please run the role seeding script first.');
            return;
        }

        //create default admin user
        const adminData: UserCreationAttributes = {
            Username: 'admin',
            Password: 'admin123', // Change this!
            Email: 'admin@hotel.com',
            RoleID: adminRole.RoleID
        };

        const newAdmin = await User.create(adminData);

        console.log('First admin user created successfully!');
        console.log('Admin Details:');
        console.log(`Username: ${newAdmin.Username}`);
        console.log(`Email: ${newAdmin.Email}`);
        console.log(`Password: admin123`);
        console.log('');
        console.log('IMPORTANT:');
        console.log('Log in immediately and change the username/email/password!');

    } catch (error) {
        console.error('Error creating first admin:', error);
        throw error;
    }
};

//run if executed directly
if (require.main === module) {
    (async () => {
        try {
            await db.sequelize.authenticate();
            console.log('Database connection established.');

            await createFirstAdmin();
            process.exit(0);
        } catch (error) {
            console.error('Failed to create admin:', error);
            process.exit(1);
        }
    })();
}