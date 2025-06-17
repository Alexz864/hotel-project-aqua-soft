import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type ApiResponse, type LoginRequest, type RegisterRequest, type AuthResponse, type Hotel } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      //baseURL: '/api',
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    //add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    //add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          //token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  //auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }


  //hotel endpoints
  async getHotels(page = 1, limit = 50): Promise<ApiResponse<Hotel[]>> {
    const response: AxiosResponse<ApiResponse<Hotel[]>> = await this.api.get(`/hotels?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getHotelByName(name: string): Promise<ApiResponse<Hotel>> {
    const response: AxiosResponse<ApiResponse<Hotel>> = await this.api.get(`/hotels/${encodeURIComponent(name)}`);
    return response.data;
  }

  async createHotel(hotelData: any): Promise<ApiResponse<Hotel>> {
    const response: AxiosResponse<ApiResponse<Hotel>> = await this.api.post('/hotels', hotelData);
    return response.data;
  }

  async updateHotel(id: number, hotelData: any): Promise<ApiResponse<Hotel>> {
    const response: AxiosResponse<ApiResponse<Hotel>> = await this.api.put(`/hotels/${id}`, hotelData);
    return response.data;
  }

  async deleteHotel(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/hotels/${id}`);
    return response.data;
  }


  //manager endpoints
  async getMyHotels(page = 1, limit = 50): Promise<ApiResponse<Hotel[]>> {
    const response: AxiosResponse<ApiResponse<Hotel[]>> = await this.api.get(`/my-hotels?page=${page}&limit=${limit}`);
    return response.data;
  }


  //user endpoints (admin only)
  async getUsers(page = 1, limit = 50, search?: string): Promise<ApiResponse> {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response: AxiosResponse<ApiResponse> = await this.api.get(url);
    return response.data;
  }

  async createUser(userData: any): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: any): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async updateUserRole(id: number, roleName: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/users/${id}/role`, { roleName });
    return response.data;
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async getHotelsWithReviews(page = 1, limit = 10): Promise<ApiResponse<Hotel[]>> {
  const response = await this.api.get(`/hotels-with-reviews?page=${page}&limit=${limit}`);
  return response.data;
  }

  
  //health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;