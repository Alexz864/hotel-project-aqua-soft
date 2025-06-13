import fs from 'fs';
import csv from 'csv-parser';
import db from '../models';

//define structure of a row mapping column names to TypeScript types
interface CSVRow {
    'Global Property ID': string;
    'Source Property ID': string;
    'Global Property Name': string;
    'Global Chain Code': string;
    'Property Address 1': string;
    'Property Address 2': string;
    'Primary Airport Code': string;
    'Property City Name': string;
    'Property State/Province': string;
    'Property Zip/Postal': string;
    'Property Country Code': string;
    'Property Phone Number': string;
    'Property Fax Number': string;
    'Sabre Property Rating': string;
    'Property Latitude': string;
    'Property Longitude': string;
    'Source Group Code': string;
}


class CSVImporter {
    private batchSize = 1000;   //process data in chunks to avoid memory issues

    //store ID mappings for foreign key relationships to use in hotels table
    private cities = new Map<string, number>();
    private regions = new Map<string, number>();

    //track failed imports
    private skippedCount = 0;
    private skippedReasons: { [key: string]: number } = {}; //object to store skippedReasons

    //import process will have three steps
    importCSV = async(filePath: string): Promise<void> => {
        console.log('Starting CSV import...');
                
        try {
            //collect unique cities and regions from csv
            await this.collectUniqueEntities(filePath);
            
            //insert cities and regions in the database
            await this.insertCitiesAndRegions();
            
            //import hotels with foreignKeys references
            await this.importHotels(filePath);
            
            console.log('CSV import completed successfully!');
            console.log(`Total skipped records: ${this.skippedCount}`);
            console.log('Skipped reasons:', this.skippedReasons);
        } catch (error) {
            console.error('Error during CSV import:', error);
            throw error;
        }
    }

    //validate row before processing
    private validateRequiredFields = (row: CSVRow): { isValid: boolean; reason?: string } => {
        //check for required fields
        const requiredFields = [
            { field: 'Global Property ID', value: row['Global Property ID'] },
            { field: 'Source Property ID', value: row['Source Property ID'] },
            { field: 'Global Property Name', value: row['Global Property Name'] },
            { field: 'Global Chain Code', value: row['Global Chain Code'] },
            { field: 'Property Address 1', value: row['Property Address 1'] },
            { field: 'Primary Airport Code', value: row['Primary Airport Code'] },
            { field: 'Property City Name', value: row['Property City Name'] },
            { field: 'Property State/Province', value: row['Property State/Province'] },
            { field: 'Property Zip/Postal', value: row['Property Zip/Postal'] },
            { field: 'Property Phone Number', value: row['Property Phone Number'] },
            { field: 'Sabre Property Rating', value: row['Sabre Property Rating'] },
            { field: 'Property Latitude', value: row['Property Latitude'] },
            { field: 'Property Longitude', value: row['Property Longitude'] },
            { field: 'Source Group Code', value: row['Source Group Code'] }
        ];

        for (const { field, value } of requiredFields) {
            if (!value || !value.toString().trim()) {
                return { isValid: false, reason: `Missing required field: ${field}` };
            }
        }

        //validate numeric fields
        if (isNaN(parseInt(row['Global Property ID']))) {
            return { isValid: false, reason: 'Invalid Global Property ID (not a number)' };
        }

        if (isNaN(parseFloat(row['Sabre Property Rating']))) {
            return { isValid: false, reason: 'Invalid Sabre Property Rating (not a number)' };
        }

        if (isNaN(parseFloat(row['Property Latitude']))) {
            return { isValid: false, reason: 'Invalid Property Latitude (not a number)' };
        }

        if (isNaN(parseFloat(row['Property Longitude']))) {
            return { isValid: false, reason: 'Invalid Property Longitude (not a number)' };
        }

        return { isValid: true };
    }

    private addSkippedReason = (reason: string): void => {
        this.skippedCount++;
        //count each skip reason: get current count (or 0 if first time) and add 1
        this.skippedReasons[reason] = (this.skippedReasons[reason] || 0) + 1;
    }

    private collectUniqueEntities = async(filePath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            console.log('Collecting unique cities and regions...');
            
            //using Sets because they don't allow duplicates
            const uniqueCities = new Set<string>();
            const uniqueRegions = new Set<string>();
            
            //create a readable stream to read the file row by row
            fs.createReadStream(filePath)
                .pipe(csv({ separator: '\t' })) //connect file stream to csv-parser
                .on('data', (row: CSVRow) => {  //csv-parser recives raw file data and outputs parsed row objects

                    //only collect data from valid records
                    const validation = this.validateRequiredFields(row);
                    if (!validation.isValid) {
                        return; //skip invalid records
                    }

                    //create composite key by combining city name and country code with a pipe separator |
                    const cityKey = `${row['Property City Name']}|${row['Property Country Code']}`;

                    //extract state/province from csv row
                    const regionKey = row['Property State/Province'];
                    
                    //handle cities - add if they exist, otherwise skip
                    if (row['Property City Name']?.trim()) {
                        uniqueCities.add(cityKey);
                    }
                    
                    //handle regions - add if they exist, otherwise skip
                    if (regionKey?.trim()) {
                        uniqueRegions.add(regionKey.trim());
                    }
                })
                .on('end', () => {
                    console.log(`Found ${uniqueCities.size} unique cities and ${uniqueRegions.size} unique regions`);
                    
                    //store in maps(key, value: cityKey->ID)
                    uniqueCities.forEach(cityKey => {
                        this.cities.set(cityKey, 0);    //set temporary ID, will be replaced
                    });
                    
                    //store in maps(key, value: regionName->ID)
                    uniqueRegions.forEach(regionName => {
                        this.regions.set(regionName, 0);    //set temporary ID, will be replaced
                    });
                    
                    resolve();  //complete promise
                })
                .on('error', reject);
        });
    }


    
    private insertCitiesAndRegions = async(): Promise<void> => {
        //create database transaction to roll back if there is any errors
        const transaction = await db.sequelize.transaction();
        
        try {
            //insert cities in batches
            console.log('Inserting cities...');

            //convert map keys into an array and transform them in database objects
            const cityEntries = Array.from(this.cities.keys()).map(cityKey => {
                //split key into separate cityName and country
                const [cityName, country] = cityKey.split('|');
                
                //create database objects
                return {
                    CityName: cityName,
                    Country: country
                }as any;
            });
            
            //batch processing
            const cityBatches = this.createBatches(cityEntries, this.batchSize);    //split array into smaller chunks for efficiency
            for (const batch of cityBatches) {
                //call Sequelize's bulk insert method
                const insertedCities = await db.City.bulkCreate(batch, {
                    transaction,    //use the transaction created above
                    returning: true //return inserted records with database-assigned ID
                }) as any[];    //array of city objects
                
                //update the cities map with actual IDs
                insertedCities.forEach((city: any) => {
                    const cityKey = `${city.CityName}|${city.Country}`; //reconstruct composite key
                    this.cities.set(cityKey, city.CityID);  //update map with real database ID
                });
            }


            //insert regions in batches
            console.log('Inserting regions...');

            //convert map keys to array and transform each regionName into a database object
            const regionEntries = Array.from(this.regions.keys()).map(regionName => ({
                PropertyStateProvinceName: regionName   //create object with the database column name
            } as any));
            
            //batch processing
            const regionBatches = this.createBatches(regionEntries, this.batchSize);    //split array into smaller chunks for efficiency
            for (const batch of regionBatches) {
                //call Sequelize's bulk insert method
                const insertedRegions = await db.Region.bulkCreate(batch, {
                    transaction,    //part of the same transaction as cities
                    returning: true //return inserted records with database-assigned ID
                }) as any[];    //result: array of region objects
                
                //update regions map with actual IDs
                insertedRegions.forEach((region: any) => {
                    this.regions.set(region.PropertyStateProvinceName, region.PropertyStateProvinceID);
                });
            }
            
            //make all changes permanent in the database if no error has occured
            await transaction.commit(); 
            console.log('Cities and regions inserted successfully');
        } catch (error) {
            await transaction.rollback();   //rollback transaction if there is any error
            throw error;
        }
    }

    private importHotels = async(filePath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            console.log('Importing hotels...');
            
            const hotels: any[] = [];   //array for hotel records before batch processing
            let processedCount = 0;
            let validCount = 0;
            
            //create a readable stream from the file
            fs.createReadStream(filePath)
                .pipe(csv({ separator: '\t' })) //pipe the stream through csv-parser, tells parser to use tab as separator
                .on('data', (row: CSVRow) => {
                    try {
                        processedCount++;
                        
                        //validate required fields
                        const validation = this.validateRequiredFields(row);
                        if (!validation.isValid) {
                            this.addSkippedReason(validation.reason!);
                            //log progress every 1000 rows
                            if (processedCount % 1000 === 0) {
                                console.log(`Processed ${processedCount} rows, ${validCount} valid, ${this.skippedCount} skipped...`);
                            }
                            return;
                        }

                        //combine city name and country code using separator
                        const cityKey = `${row['Property City Name']}|${row['Property Country Code']}`;
                        
                        //handle region mapping
                        const regionName = row['Property State/Province'].trim();
                        
                        //look up the database ID for city and region
                        const cityID = this.cities.get(cityKey);
                        const regionID = this.regions.get(regionName);
                        
                        //if one id is missing, skip
                        if (!cityID || !regionID) {
                            this.addSkippedReason('Missing city or region mapping');
                            console.warn(`Skipping hotel due to missing city or region: ${row['Global Property Name']}`);
                            console.warn(`  City: "${row['Property City Name']}" (${row['Property Country Code']}) - ID: ${cityID}`);
                            console.warn(`  Region: "${regionName}" - ID: ${regionID}`);
                            return;
                        }
                        
                        //convert csv row data into database object
                        const hotel = {
                            GlobalPropertyID: parseInt(row['Global Property ID']),
                            SourcePropertyID: row['Source Property ID'],
                            GlobalPropertyName: row['Global Property Name'],
                            GlobalChainCode: row['Global Chain Code'],
                            PropertyAddress1: row['Property Address 1'],
                            PropertyAddress2: row['Property Address 2'] || null,
                            PrimaryAirportCode: row['Primary Airport Code'],
                            CityID: cityID,
                            PropertyStateProvinceID: regionID,
                            PropertyZipPostal: row['Property Zip/Postal'],
                            PropertyPhoneNumber: row['Property Phone Number'],
                            PropertyFaxNumber: row['Property Fax Number'] || null,
                            SabrePropertyRating: parseFloat(row['Sabre Property Rating']),
                            PropertyLatitude: parseFloat(row['Property Latitude']),
                            PropertyLongitude: parseFloat(row['Property Longitude']),
                            SourceGroupCode: row['Source Group Code']
                        } as any;
                        
                        hotels.push(hotel); //add hotel to current batch array
                        validCount++;
                        
                        //when reaches batchSize start processing
                        if (hotels.length >= this.batchSize) {
                            this.processHotelBatch([...hotels]).then(() => {
                                console.log(`Processed ${processedCount} rows, ${validCount} valid hotels imported, ${this.skippedCount} skipped...`);
                            }).catch(error => {
                                console.error('Error processing hotel batch:', error);
                                this.addSkippedReason('Batch processing error');
                            });
                            hotels.length = 0; //clear the array
                        }

                        //log progress every 1000 rows
                        if (processedCount % 1000 === 0) {
                            console.log(`Processed ${processedCount} rows, ${validCount} valid, ${this.skippedCount} skipped...`);
                        }
                    } catch (error) {
                        console.error('Error processing row:', error);
                        this.addSkippedReason('Row processing error');
                    }
                })
                .on('end', async () => {
                    try {
                        //process remaining hotels in the final batch
                        if (hotels.length > 0) {
                            await this.processHotelBatch(hotels);   //wait for batch processing to complete
                        }
                        
                        console.log(`Hotel import completed!`);
                        console.log(`Total rows processed: ${processedCount}`);
                        console.log(`Valid hotels imported: ${validCount}`);
                        console.log(`Records skipped: ${this.skippedCount}`);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    private processHotelBatch = async(hotels: any[]): Promise<void> => {
        //create database transaction to roll back if there is any errors
        const transaction = await db.sequelize.transaction();
        
        try {
            //async operation to insert hotels at once
            await db.Hotel.bulkCreate(hotels, {
                transaction,    //use the transaction created above
                ignoreDuplicates: true,
                validate: true,
                fields: [   //security feature; only insert the specified fields
                    'GlobalPropertyID',
                    'SourcePropertyID',
                    'GlobalPropertyName', 
                    'GlobalChainCode',
                    'PropertyAddress1',
                    'PropertyAddress2',
                    'PrimaryAirportCode',
                    'CityID',
                    'PropertyStateProvinceID',
                    'PropertyZipPostal',
                    'PropertyPhoneNumber',
                    'PropertyFaxNumber',
                    'SabrePropertyRating',
                    'PropertyLatitude',
                    'PropertyLongitude',
                    'SourceGroupCode'
                ]
            });
            
            //make all changes permanent in the database if no error has occured
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();   //rollback transaction if there is any error
            console.error('Error in hotel batch processing:', error);
            throw error;
        }
    }

    //we use generic type parameter(<T>) so the method can work with arrays of any type(T could be string, number etc)
    private createBatches = <T>(array: T[], batchSize: number): T[][] => {
        const batches: T[][] = [];  //create a 2D(array of arrays of type T)
        for (let i = 0; i < array.length; i += batchSize) { //loop jumps by batchSize amount each iteration
            batches.push(array.slice(i, i + batchSize));    //slice a portion of the original array and add to the batches array
        }
        return batches;
    }
}

//usage function
const importHotelData = async(csvFilePath: string): Promise<void> => {
    const importer = new CSVImporter();
    
    try {
        //ensure database is connected
        await db.sequelize.authenticate();
        console.log('Database connection established.');
        
        //sync database (create tables if they don't exist)
        await db.sequelize.sync({ alter: true });
        console.log('Database synchronized.');
        
        //import the CSV data
        await importer.importCSV(csvFilePath);
        
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
}


//array containing all command line arguments
const csvFilePath = process.argv[2];

if (!csvFilePath) {
    console.error('Please provide the CSV file path as an argument');
    console.error('Usage: npm run import-csv <path-to-csv-file>');
    process.exit(1);
}

//check if the file exists before proceeding
if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: File not found at path: ${csvFilePath}`);
    console.error('Please check the file path and try again.');
    console.error('Current working directory:', process.cwd()); //return current working directory
    process.exit(1);
}

console.log(`File found: ${csvFilePath}`);

//start the import
importHotelData(csvFilePath)
    .then(() => {
        console.log('Import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Import failed:', error);
        process.exit(1);
    });