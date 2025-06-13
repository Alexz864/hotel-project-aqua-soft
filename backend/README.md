# Hotel Management API

A comprehensive RESTful API for managing hotel data built with Node.js, Express, TypeScript, and PostgreSQL. The API provides functionality to manage hotels, cities, and regions with authentication, pagination, and CSV data import capabilities.

## Features

- **Hotel Management**: Full CRUD operations for hotel data
- **Authentication**: JWT-based authentication for protected routes
- **Data Relationships**: Properly structured relationships between hotels, cities, and regions
- **Pagination**: Efficient pagination for large datasets
- **CSV Import**: Bulk import hotels from CSV files
- **Type Safety**: Built with TypeScript for enhanced developer experience
- **Database**: PostgreSQL with Sequelize ORM
- **Validation**: Comprehensive input validation and error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **CSV Processing**: csv-parser
- **Development**: nodemon, ts-node

## API Structure

- `src/config`: Database configuration
- `src/controllers`: API controllers for handling request/response
- `src/models`: Database models defined with Sequelize
- `src/routes`: API route definitions
- `src/middleware`: Authentication and validation middleware
- `src/scripts`: CSV import utility for bulk data operations
- `src/types`: TypeScript interfaces and type definitions

## Installation

### Clone the repository

```bash
git clone https://github.com/Alexz864/internship-aqua-soft
cd mini_sprint_2
```

### Install dependencies

```bash
npm install
```

### Set up environment variables

Create a `.env` file in the root directory:

```
#Database Configuration
DB_NAME=hotel_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

#JWT Configuration
JWT_SECRET=your-secret-key

#Server Configuration
PORT=3000
NODE_ENV=development
```

### Set up PostgreSQL database

- Install PostgreSQL
- Create a database named hotel_db
- Update the `.env` file with your database credentials

## Usage

### Development

Start the development server with hot reload:

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### CSV import

```bash
npm run import-csv < path-to-your-csv-file >
```

### CSV Format Requirements:

The CSV file should be tab-separated with the following columns:

- `Global Property ID`
- `Source Property ID`
- `Global Property Name`
- `Global Chain Code`
- `Property Address 1`
- `Property Address 2`
- `Primary Airport Code`
- `Property City Name`
- `Property State/Province`
- `Property Zip/Postal`
- `Property Country Code`
- `Property Phone Number`
- `Property Fax Number`
- `Sabre Property Rating`
- `Property Latitude`
- `Property Longitude`
- `Source Group Code`

## API Documentation

The API provides the following main endpoints:

### Public Endpoints

GET `/api/hotels`: Get all hotels with pagination
GET `/api/hotels/`:name: Get hotel by name
GET `/health`: API health check

### Protected Endpoints (Require Authentication)

POST `/api/hotels`: Create new hotel
PUT `/api/hotels/:id`: Update hotel
DELETE `/api/hotels/:id`: Delete hotel

### Authentication

POST `/api/auth/login`: Get JWT token for testing

## License

This project is licensed under the MIT License - see the LICENSE file for details.
