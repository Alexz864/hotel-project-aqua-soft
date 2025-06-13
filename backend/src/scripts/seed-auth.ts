import db from '../models';
import { RoleAttributes, PermissionAttributes } from '../types';

const { Role, Permission } = db;

//seed roles and permissions
export const seedRolesAndPermissions = async (): Promise<void> => {
    let transaction;
    
    try {
        transaction = await db.sequelize.transaction();
        console.log('Starting roles and permissions seeding...');

        //check if roles already exist
        const existingRoles = await Role.findAll({ transaction });
        if (existingRoles.length > 0) {
            console.log(`Found ${existingRoles.length} existing roles. Skipping role creation.`);
        } else {
            //create roles using proper creation interfaces
            await Role.create({ RoleName: 'traveler' } as RoleAttributes, { transaction });
            await Role.create({ RoleName: 'hotel_manager' } as RoleAttributes, { transaction });
            await Role.create({ RoleName: 'data_operator' } as RoleAttributes, { transaction });
            await Role.create({ RoleName: 'admin' } as RoleAttributes, { transaction });

            console.log(`Created the roles.`);
        }

        //find role IDs for permission creation
        const travelerRole = await Role.findOne({ where: { RoleName: 'traveler' }, transaction });
        const hotelManagerRole = await Role.findOne({ where: { RoleName: 'hotel_manager' }, transaction });
        const dataOperatorRole = await Role.findOne({ where: { RoleName: 'data_operator' }, transaction });
        const adminRole = await Role.findOne({ where: { RoleName: 'admin' }, transaction });

        if (!travelerRole || !hotelManagerRole || !dataOperatorRole || !adminRole) {
            throw new Error('Failed to create or find roles');
        }

        //check if permissions already exist
        const existingPermissions = await Permission.findAll({ transaction });
        if (existingPermissions.length > 0) {
            console.log(`Found ${existingPermissions.length} existing permissions. Skipping permission creation.`);
        } else {
            //traveler permissions
            await Permission.create({ RoleID: travelerRole.RoleID, Resource: 'hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: travelerRole.RoleID, Resource: 'reviews', Action: 'write' } as 
                PermissionAttributes, { transaction });
            
            //hotel_manager permissions
            await Permission.create({ RoleID: hotelManagerRole.RoleID, Resource: 'hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: hotelManagerRole.RoleID, Resource: 'own_hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            
            //data_operator permissions
            await Permission.create({ RoleID: dataOperatorRole.RoleID, Resource: 'hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: dataOperatorRole.RoleID, Resource: 'hotels', Action: 'write' } as 
                PermissionAttributes, { transaction });
            
            //admin permissions
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'hotels', Action: 'write' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'reviews', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'reviews', Action: 'write' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'users', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'users', Action: 'write' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'own_hotels', Action: 'read' } as 
                PermissionAttributes, { transaction });
            await Permission.create({ RoleID: adminRole.RoleID, Resource: 'own_hotels', Action: 'write' } as 
                PermissionAttributes, { transaction });

            console.log(`Created the permissions.`);
        }

        await transaction.commit();
        console.log('Roles and permissions seeded successfully!');

    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        console.error('Error seeding roles and permissions:', error);
        throw error;
    }
};