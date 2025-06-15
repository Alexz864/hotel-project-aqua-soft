import db from '../models';
import { Transaction } from 'sequelize';

const { Hotel, User, Role, sequelize } = db;

//assign managers randomly to existing hotels
const assignManagersRandomly = async (): Promise<void> => {

    const transaction: Transaction = await sequelize.transaction();
    
    try {
        console.log('Starting random manager assignment to existing hotels...');

        //get all hotel managers
        const hotelManagers = await User.findAll({
            include: [{
                model: Role,
                as: 'role',
                where: { RoleName: 'hotel_manager' }
            }],
            transaction
        });

        if (hotelManagers.length === 0) {
            console.log('No hotel managers found!');
            await transaction.rollback();
            return;
        }

        //get all hotels that don't have a manager assigned yet
        const unassignedHotels = await Hotel.findAll({
            where: {
                ManagerUsername: null
            },
            attributes: ['GlobalPropertyID'],
            transaction
        });

        if (unassignedHotels.length === 0) {
            console.log('All hotels already have managers assigned!');
            await transaction.rollback();
            return;
        }

        console.log(`Found ${hotelManagers.length} hotel managers.`);
        console.log(`Found ${unassignedHotels.length} hotels without managers.`);
        console.log('Starting batch assignment process...\n');

        //prepare batch updates - group hotels by manager
        const managerAssignments = new Map<string, number[]>();
        const managerCounts = new Map<string, number>();

        //initialize manager counts
        hotelManagers.forEach(manager => {
            managerAssignments.set(manager.Username, []);
            managerCounts.set(manager.Username, 0);
        });

        //distribute hotels
        for (let i = 0; i < unassignedHotels.length; i++) {
            const hotel = unassignedHotels[i];
            const managerIndex = i % hotelManagers.length;
            const selectedManager = hotelManagers[managerIndex];
            
            //add hotel to manager's list
            managerAssignments.get(selectedManager.Username)!.push(hotel.GlobalPropertyID);
            
            //increment count
            const currentCount = managerCounts.get(selectedManager.Username) || 0;
            managerCounts.set(selectedManager.Username, currentCount + 1);
        }

        console.log('Assignment Distribution:');
        managerCounts.forEach((count, username) => {
            console.log(`   ${username}: ${count} hotels.`);
        });

        console.log('\nExecuting batch updates...');

        //execute batch updates for each manager
        let totalAssigned = 0;
        for (const [managerUsername, hotelIds] of managerAssignments) {
            if (hotelIds.length > 0) {
                //batch update all hotels for this manager at once
                const [affectedRows] = await Hotel.update(
                    { ManagerUsername: managerUsername },
                    {
                        where: {
                            GlobalPropertyID: hotelIds
                        },
                        transaction
                    }
                );

                totalAssigned += affectedRows;
                console.log(`${managerUsername}: ${affectedRows} hotels assigned.`);
            }
        }

        await transaction.commit();
        
        console.log('\nRandom manager assignment completed successfully!');
        console.log(`Total hotels assigned: ${totalAssigned}`);
        
    } catch (error) {
        transaction?.rollback();
        console.error('Error during manager assignment:', error);
        throw error;
    }
};

const runAssignment = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.\n');

        await assignManagersRandomly();
        
        process.exit(0);
    } catch (error) {
        console.error('Assignment failed:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    runAssignment();
}