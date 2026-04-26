export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: PaginationParams // Allow pagination property for posts API
}

export interface SearchParams {
  q?: string
  type?: string
}

export interface User {
  id: string
  username: string
  email?: string
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
  uploadedAt: string
  path?: string
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  userFileCount: number
  userStorageUsed: number
}
