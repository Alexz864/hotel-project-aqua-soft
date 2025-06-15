//hotel interface
export interface HotelAttributes {
    GlobalPropertyID: number;
    SourcePropertyID: string;
    GlobalPropertyName: string;
    GlobalChainCode: string;
    PropertyAddress1: string;
    PropertyAddress2?: string;
    PrimaryAirportCode: string;
    CityID: number;
    PropertyStateProvinceID: number;
    PropertyZipPostal: string;
    PropertyPhoneNumber: string;
    PropertyFaxNumber?: string;
    SabrePropertyRating: number;
    PropertyLatitude: number;
    PropertyLongitude: number;
    SourceGroupCode: string;
    ManagerUsername: string | null;
}

//interface for creating new hotels(Omit removes 'GlobalPropertyID' because we auto-generate ID in the database)
export interface HotelCreationAttributes extends Omit<HotelAttributes, 'GlobalPropertyID'> {}

//city interface
export interface CityAttributes {
    CityID: number;
    CityName: string;
    Country: string;
}

//region interface
export interface RegionAttributes {
    PropertyStateProvinceID: number;
    PropertyStateProvinceName: string;
}


//review interface
export interface ReviewAttributes {
    ReviewID: number;
    HotelID: number;
    ReviewerName: string;
    ReviewSubject: string;
    ReviewContent: string;
    ReviewDate: Date;
    OverallRating: number;
    CleanlinessRating: number;
    LocationRating: number;
    ServiceRating: number;
    ValueRating: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReviewCreationAttributes extends Omit<ReviewAttributes, 'ReviewID' | 'createdAt' | 'updatedAt'> {}


//auth-related interfaces
export interface UserPayload {
    id: string;
    email: string;
    role?: string;
}

export interface JWTPayload extends UserPayload {
    iat?: number;   //issued at
    exp?: number;   //expires at
}


//interface to standardize all API responses, T is generic and can hold any type of data
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: PaginationInfo;
}

//interface to standardize pagination data across paginated endpoints
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}


export interface HotelRequiredFields extends Omit<HotelAttributes, 'GlobalPropertyID' | 'PropertyAddress2' | 'PropertyFaxNumber' | 'ManagerUsername'>{}


//extend express Request interface to include user information so that we can use 'req.user.id'
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export interface RoleAttributes {
    RoleID: number;
    RoleName: string;
}

export interface UserAttributes {
    UserID: number;
    Username: string;
    Password: string;
    Email: string;
    RoleID: number;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'UserID'> {};

export interface PermissionAttributes {
    PermissionID: number;
    RoleID: number;
    Resource: string;
    Action: string;
}