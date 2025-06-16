//API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

//auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface User {
  UserID: number;
  Username: string;
  Email: string;
  RoleID: number;
  role?: {
    RoleName: string;
  };
}

//hotel types
export interface Hotel {
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
  city?: {
    CityName: string;
    Country: string;
  };
  region?: {
    PropertyStateProvinceName: string;
  };
  manager?: {
    Username: string;
    Email: string;
  };
}

export interface HotelCreationRequest {
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
  ManagerUsername: string;
}

//form validation types
export interface FormErrors {
  [key: string]: string;
}