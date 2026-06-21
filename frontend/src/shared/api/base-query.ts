import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { isAxiosError } from 'axios'

import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

/**
 * Transport-agnostic shape consumed by RTK Query endpoints.
 * `method: 'upload'` maps to multipart/form-data via apiClient.uploadFile.
 */
export interface AxiosBaseQueryArgs {
  url: string
  method?: 'get' | 'post' | 'put' | 'delete' | 'upload'
  data?: unknown
  params?: Record<string, string>
}

/**
 * Normalized error surfaced to RTK Query / components.
 * `status` mirrors HTTP status when available, `400` for soft `{ success:false }` payloads.
 */
export interface ApiQueryError {
  status: number
  message: string
}

/**
 * RTK Query baseQuery delegating to the shared axios client.
 *
 * Why wrap apiClient instead of fetchBaseQuery: it preserves the existing
 * request/response interceptors (Bearer injection + 401 silent-refresh + retry)
 * as the single networking source of truth. Endpoints receive the already
 * unwrapped `data` payload; soft API failures (`success: false`) are mapped to errors.
 */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiQueryError> =>
  async ({ url, method = 'get', data, params }) => {
    try {
      let response: ApiResponse<unknown>

      switch (method) {
        case 'get':
          response = await apiClient.get<ApiResponse<unknown>>(url, params)
          break
        case 'post':
          response = await apiClient.post<ApiResponse<unknown>>(url, data)
          break
        case 'put':
          response = await apiClient.put<ApiResponse<unknown>>(url, data)
          break
        case 'delete':
          response = await apiClient.delete<ApiResponse<unknown>>(url)
          break
        case 'upload':
          response = await apiClient.uploadFile<ApiResponse<unknown>>(
            url,
            data as FormData
          )
          break
        default:
          throw new Error(
            `Unsupported HTTP method inside axiosBaseQuery: ${method}`
          )
      }

      if (response && response.success === false) {
        return {
          error: {
            status: 400,
            message: response.error || response.message || 'Request failed'
          }
        }
      }

      return { data: response?.data }
    } catch (error) {
      if (isAxiosError(error)) {
        const payload = error.response?.data as ApiResponse<unknown> | undefined
        return {
          error: {
            status: error.response?.status ?? 0,
            message:
              payload?.error ||
              payload?.message ||
              error.message ||
              'Network error'
          }
        }
      }

      return {
        error: {
          status: 0,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
