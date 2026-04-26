import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { config } from '../config'

/**
 * API Client class for handling HTTP requests with axios
 * Provides centralized configuration for authentication, error handling, and request/response interceptors
 */
class ApiClient {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      withCredentials: true // Include cookies for refresh tokens
    })

    this.setupInterceptors()
  }

  /**
   * Set up request and response interceptors for token handling and error management
   * @private
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(
            config.auth?.tokenKey || 'access_token'
          )
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem(config.auth.tokenKey)
            localStorage.removeItem(config.auth.refreshTokenKey)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Generic GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Promise with response data
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, {
      params
    })

    return response.data
  }

  /**
   * Generic POST request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with response data
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      data
    )
    return response.data
  }

  /**
   * Generic PUT request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with response data
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(
      endpoint,
      data
    )
    return response.data
  }

  /**
   * Generic DELETE request
   * @param endpoint - API endpoint
   * @returns Promise with response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint)
    return response.data
  }

  /**
   * File upload request
   * @param endpoint - API endpoint
   * @param formData - FormData containing file
   * @returns Promise with response data
   */
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  }

  /**
   * Download file as blob
   * @param endpoint - API endpoint
   * @returns Promise with blob data
   */
  async downloadFile(endpoint: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.axiosInstance.get(
      endpoint,
      {
        responseType: 'blob'
      }
    )
    return response.data
  }
}

export const apiClient = new ApiClient()
