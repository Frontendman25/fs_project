import { baseApi } from '@/shared/api/base-api'
import type {
  FileMetadata,
  StorageStats,
  PaginationParams,
  SearchParams
} from '@/shared/types/api'

interface PaginatedFiles {
  files: FileMetadata[]
  total: number
  page: number
  totalPages: number
}

const buildFilesUrl = ({ page, limit }: PaginationParams): string => {
  const params = new URLSearchParams()
  if (page) params.append('page', String(page))
  if (limit) params.append('limit', String(limit))
  const qs = params.toString()
  return qs ? `/api/files?${qs}` : '/api/files'
}

/**
 * Files server-state via RTK Query. Replaces the former files slice + thunks.
 */
export const filesApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFiles: build.query<PaginatedFiles, PaginationParams | void>({
      query: (args) => ({ url: buildFilesUrl(args ?? {}), method: 'get' }),
      providesTags: (result) =>
        result
          ? [
              ...result.files.map((file) => ({
                type: 'Files' as const,
                id: file.id
              })),
              { type: 'Files' as const, id: 'LIST' }
            ]
          : [{ type: 'Files' as const, id: 'LIST' }]
    }),

    searchFiles: build.query<FileMetadata[], SearchParams>({
      query: ({ q, type }) => {
        const params: Record<string, string> = {}
        if (q) params.q = q
        if (type) params.type = type
        return { url: '/api/files/search', method: 'get', params }
      },
      providesTags: [{ type: 'Files', id: 'LIST' }]
    }),

    getFileMetadata: build.query<FileMetadata, string>({
      query: (fileId) => ({
        url: `/api/files/${fileId}/metadata`,
        method: 'get'
      }),
      providesTags: (_result, _error, fileId) => [{ type: 'Files', id: fileId }]
    }),

    getStorageStats: build.query<StorageStats, void>({
      query: () => ({ url: '/api/files/stats', method: 'get' }),
      providesTags: ['StorageStats']
    }),

    uploadFile: build.mutation<FileMetadata, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return { url: '/api/upload', method: 'upload', data: formData }
      },
      invalidatesTags: [{ type: 'Files', id: 'LIST' }, 'StorageStats']
    }),

    deleteFile: build.mutation<void, string>({
      query: (fileId) => ({ url: `/api/files/${fileId}`, method: 'delete' }),
      invalidatesTags: (_result, _error, fileId) => [
        { type: 'Files', id: fileId },
        { type: 'Files', id: 'LIST' },
        'StorageStats'
      ]
    })
  })
})

export const {
  useGetFilesQuery,
  useSearchFilesQuery,
  useGetFileMetadataQuery,
  useGetStorageStatsQuery,
  useUploadFileMutation,
  useDeleteFileMutation
} = filesApiSlice
