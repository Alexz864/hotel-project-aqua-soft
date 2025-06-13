import fs from 'fs';
import csv from 'csv-parser';
import db from '../models';

//define structure of a row
interface ReviewCSVRow {
    'HotelName': string;
    'ReviewerName': string;
    'ReviewTitle': string;
    'ReviewContent': string;
    'ValueRating': string;
    'LocationRating': string;
    'ServiceRating': string;
    'RoomsRating': string;
    'CleanlinessRating': string;
    'SleepQualityRating': string;
}

class ReviewCSVImporter {

    private hotels = new Map<string, number>();

    private skippedCount = 0;
    private skippedReasons: { [key: string]: number } = {};

    //import process will have two steps
    importCSV = async (filePath: string): Promise<void> => {
        console.log('Starting Review CSV import...');

        try {
            //load hotel mappings from database
            await this.loadHotelMappings();

            //import reviews with foreign key references
            await this.importReviews(filePath);

            console.log('Review CSV import completed successfully!');
            console.log(`Total skipped records: ${this.skippedCount}`);
            console.log('Skipped reasons:', this.skippedReasons);
        } catch (error) {
            console.error('Error during Review CSV import:', error);
            throw error;
        }
    }

    //load existing hotels to create name->ID mapping
    private loadHotelMappings = async (): Promise<void> => {
        console.log('Loading hotel mappings from database...');

        try {
            //fetch all hotels
            const hotels = await db.Hotel.findAll({
                attributes: ['GlobalPropertyID', 'GlobalPropertyName'],
                raw: true
            });

            //create mapping from hotel name to ID
            hotels.forEach((hotel: any) => {
                this.hotels.set(hotel.GlobalPropertyName.trim(), hotel.GlobalPropertyID);
            });

            console.log(`Loaded ${this.hotels.size} hotel mappings`);
        } catch (error) {
            console.error('Error loading hotel mappings:', error);
            throw error;
        }
    }

    //validate row before processing
    private validateRequiredFields = (row: ReviewCSVRow): { isValid: boolean; reason?: string } => {

        const requiredFields = [
            { field: 'HotelName', value: row['HotelName'] },
            { field: 'ReviewerName', value: row['ReviewerName'] },
            { field: 'ReviewTitle', value: row['ReviewTitle'] },
            { field: 'ReviewContent', value: row['ReviewContent'] },
            { field: 'ValueRating', value: row['ValueRating'] },
            { field: 'LocationRating', value: row['LocationRating'] },
            { field: 'ServiceRating', value: row['ServiceRating'] },
            { field: 'RoomsRating', value: row['RoomsRating'] },
            { field: 'CleanlinessRating', value: row['CleanlinessRating'] },
            { field: 'SleepQualityRating', value: row['SleepQualityRating'] }
        ];

        for (const { field, value } of requiredFields) {
            if (!value || !value.toString().trim()) {
                return { isValid: false, reason: `Missing required field: ${field}` };
            }
        }

        //validate rating fields (numbers between 1.0 and 5.0)
        const ratingFields = [
            'ValueRating', 'LocationRating', 
            'ServiceRating', 'RoomsRating', 'CleanlinessRating', 'SleepQualityRating'
        ];

        for (const field of ratingFields) {
            const rating = parseFloat(row[field as keyof ReviewCSVRow]);
            if (isNaN(rating) || rating < 1.0 || rating > 5.0) {
                return { isValid: false, reason: `Invalid ${field} (must be between 1.0 and 5.0)` };
            }
        }

        return { isValid: true };
    }

    private addSkippedReason = (reason: string): void => {
        this.skippedCount++;
        //count each skip reason: get current count (or 0 if first time) and add 1
        this.skippedReasons[reason] = (this.skippedReasons[reason] || 0) + 1;
    }

    private importReviews = async (filePath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            console.log('Importing reviews...');

            const reviews: any[] = [];
            let processedCount = 0;

            //create a readable stream to read the file row by row
            fs.createReadStream(filePath)
                .pipe(csv({ separator: ',' })) //pipe the stream through csv-parser, tells parser to use ',' as separator
                .on('data', (row: ReviewCSVRow) => {    //csv-parser recives raw file data and outputs parsed row objects
                    try {
                        processedCount++;

                        //validate required fields
                        const validation = this.validateRequiredFields(row);
                        if (!validation.isValid) {
                            this.addSkippedReason(validation.reason!);
                            return;
                        }

                        //look up hotel ID by name
                        const hotelName = row['HotelName'].trim();
                        const hotelID = this.hotels.get(hotelName);

                        if (!hotelID) {
                            this.addSkippedReason('Hotel not found in database');
                            console.warn(`Skipping review - hotel not found: "${hotelName}"`);
                            return;
                        }

                        //convert CSV row data into database object
                        const review = {
                            GlobalPropertyID: hotelID,
                            ReviewerName: row['ReviewerName'].trim(),
                            ReviewTitle: row['ReviewTitle'].trim(),
                            ReviewContent: row['ReviewContent'].trim(),
                            ValueRating: parseFloat(row['ValueRating']),
                            LocationRating: parseFloat(row['LocationRating']),
                            ServiceRating: parseFloat(row['ServiceRating']),
                            RoomsRating: parseFloat(row['RoomsRating']),
                            CleanlinessRating: parseFloat(row['CleanlinessRating']),
                            SleepQualityRating: parseFloat(row['SleepQualityRating'])
                        };

                        reviews.push(review);
                    } catch (error) {
                        console.error('Error processing row:', error);
                        this.addSkippedReason('Row processing error');
                    }
                })
                .on('end', async () => {
                    try {
                        //process all reviews at once
                        if (reviews.length > 0) {
                            await this.processAllReviews(reviews);
                        }

                        console.log(`Review import completed!`);
                        console.log(`Total rows processed: ${processedCount}`);
                        console.log(`Valid reviews imported: ${reviews.length}`);
                        console.log(`Records skipped: ${this.skippedCount}`);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    private processAllReviews = async (reviews: any[]): Promise<void> => {
        console.log(`Inserting ${reviews.length} reviews into database...`);
        
        //create database transaction to roll back if there are any errors
        const transaction = await db.sequelize.transaction();

        try {
            //insert all reviews at once
            await db.Review.bulkCreate(reviews, {
                transaction,
                ignoreDuplicates: true,
                validate: true,
                fields: [
                    'GlobalPropertyID',
                    'ReviewerName',
                    'ReviewTitle',
                    'ReviewContent',
                    'ValueRating',
                    'LocationRating',
                    'ServiceRating',
                    'RoomsRating',
                    'CleanlinessRating',
                    'SleepQualityRating'
                ]
            });

            await transaction.commit();
            console.log('All reviews inserted successfully!');
        } catch (error) {
            await transaction.rollback();
            console.error('Error inserting reviews:', error);
            throw error;
        }
    }
}

const importReviewData = async (csvFilePath: string): Promise<void> => {
    const importer = new ReviewCSVImporter();

    try {
        //ensure database is connected
        await db.sequelize.authenticate();
        console.log('Database connection established.');

        //sync database (create table if it doesn't exist)
        await db.sequelize.sync({ alter: true });
        console.log('Database synchronized.');

        //import the CSV data
        await importer.importCSV(csvFilePath);

    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
}

//get file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
    console.error('Please provide the CSV file path as an argument');
    console.error('Usage: npm run import-reviews <path-to-csv-file>');
    process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: File not found at path: ${csvFilePath}`);
    console.error('Please check the file path and try again.');
    console.error('Current working directory:', process.cwd());
    process.exit(1);
}

console.log(`File found: ${csvFilePath}`);

importReviewData(csvFilePath)
    .then(() => {
        console.log('Review import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Review import failed:', error);
        process.exit(1);
    });