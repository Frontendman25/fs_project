'use client'

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

import { filesApi } from '../../../shared/api/files'
import {
  FileMetadata,
  StorageStats,
  PaginationParams,
  SearchParams
} from '../../../shared/types/api'

interface FilesState {
  files: FileMetadata[]
  currentFile: FileMetadata | null
  storageStats: StorageStats | null
  isLoading: boolean
  isUploading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  searchQuery: string
  selectedFileType: string
}

const initialState: FilesState = {
  files: [],
  currentFile: null,
  storageStats: null,
  isLoading: false,
  isUploading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0
  },
  searchQuery: '',
  selectedFileType: ''
}

// Async thunks
export const uploadFile = createAsyncThunk(
  'files/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await filesApi.uploadFile(file)

      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || 'Upload failed')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Upload failed'
      )
    }
  }
)

export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (params: PaginationParams = {}, { rejectWithValue }) => {
    try {
      const response = await filesApi.getFiles(params)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch files')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch files'
      )
    }
  }
)

export const searchFiles = createAsyncThunk(
  'files/search',
  async (params: SearchParams, { rejectWithValue }) => {
    try {
      const response = await filesApi.searchFiles(params)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Search failed')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Search failed'
      )
    }
  }
)

export const deleteFile = createAsyncThunk(
  'files/delete',
  async (fileId: string, { rejectWithValue }) => {
    try {
      const response = await filesApi.deleteFile(fileId)
      if (response.success) {
        return fileId
      }
      throw new Error(response.message || 'Delete failed')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Delete failed'
      )
    }
  }
)

export const fetchFileMetadata = createAsyncThunk(
  'files/fetchMetadata',
  async (fileId: string, { rejectWithValue }) => {
    try {
      const response = await filesApi.getFileMetadata(fileId)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch file metadata')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch file metadata'
      )
    }
  }
)

export const fetchStorageStats = createAsyncThunk(
  'files/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await filesApi.getStorageStats()
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch storage stats')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch storage stats'
      )
    }
  }
)

export const downloadFile = createAsyncThunk(
  'files/download',
  async (
    { fileId, filename }: { fileId: string; filename: string },
    { rejectWithValue }
  ) => {
    try {
      const blob = await filesApi.downloadFile(fileId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { fileId, filename }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Download failed'
      )
    }
  }
)

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setSelectedFileType: (state, action: PayloadAction<string>) => {
      state.selectedFileType = action.payload
    },
    setCurrentFile: (state, action: PayloadAction<FileMetadata | null>) => {
      state.currentFile = action.payload
    },
    clearFiles: (state) => {
      state.files = []
      state.pagination = {
        page: 1,
        totalPages: 1,
        total: 0
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isUploading = false
        state.files.unshift(action.payload)
        state.error = null
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.payload as string
      })
      // Fetch files
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false
        state.files = action.payload.files
        state.pagination = {
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          total: action.payload.total
        }
        state.error = null
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Search files
      .addCase(searchFiles.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchFiles.fulfilled, (state, action) => {
        state.isLoading = false
        state.files = action.payload
        state.error = null
      })
      .addCase(searchFiles.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Delete file
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file.id !== action.payload)
        if (state.currentFile?.id === action.payload) {
          state.currentFile = null
        }
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch file metadata
      .addCase(fetchFileMetadata.fulfilled, (state, action) => {
        state.currentFile = action.payload
      })
      .addCase(fetchFileMetadata.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch storage stats
      .addCase(fetchStorageStats.fulfilled, (state, action) => {
        state.storageStats = action.payload
      })
      .addCase(fetchStorageStats.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Download file
      .addCase(downloadFile.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const {
  clearError,
  setSearchQuery,
  setSelectedFileType,
  setCurrentFile,
  clearFiles
} = filesSlice.actions

export const filesReducer = filesSlice.reducer
