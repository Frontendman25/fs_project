import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'

import { config } from '../config'
import {
  getAccessToken,
  notifySessionExpired
} from '@/shared/lib/auth/access-token.store'
import { silentRefreshAccessToken } from '@/shared/lib/auth/silent-refresh'

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false
  }
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  )
}

/**
 * API Client — Bearer access token in memory, refresh via httpOnly cookie.
 */
class ApiClient {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      withCredentials: true
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((requestConfig) => {
      const token = getAccessToken()
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }
      return requestConfig
    })

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as RetryableConfig | undefined

        if (
          error.response?.status !== 401 ||
          !originalRequest ||
          originalRequest._retry ||
          isAuthEndpoint(originalRequest.url)
        ) {
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          const newToken = await silentRefreshAccessToken()
          if (!newToken) {
            notifySessionExpired()
            return Promise.reject(error)
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return this.axiosInstance(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }
    )
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, {
      params
    })
    return response.data
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(
      endpoint,
      data
    )
    return response.data
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(
      endpoint,
      data
    )
    return response.data
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint)
    return response.data
  }

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
