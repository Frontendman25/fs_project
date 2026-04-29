'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Search,
  Download,
  Trash2,
  File,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'

import { AppDispatch, RootState } from '../../../app/store'
import {
  fetchFiles,
  deleteFile,
  downloadFile,
  setSearchQuery,
  setSelectedFileType,
  clearError
} from '../../../entities/files/model/filesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatFileSize,
  formatDate,
  getFileIcon,
  truncateText
} from '../../../shared/lib/utils'
import { toast } from 'sonner'
import { FileMetadata } from '@/shared/types/api'

interface FileListProps {
  onFileSelect?: (fileId: string) => void
}

/**
 * File list component for displaying and managing user files
 * @param onFileSelect - Callback function called when a file is selected
 */
export function FileList({ onFileSelect }: FileListProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { files, isLoading, error, pagination, searchQuery, selectedFileType } =
    useSelector((state: RootState) => state.files)

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  useEffect(() => {
    dispatch(fetchFiles({ page: 1, limit: 10 }))
  }, [dispatch])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    dispatch(setSearchQuery(localSearchQuery))
    // Implement search logic here
  }

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      await dispatch(downloadFile({ fileId, filename }))
      toast.success(`Downloading ${filename}`)
    } catch (error) {
      toast.error('Failed to download file. Please try again.')
    }
  }

  const handleDelete = async (fileId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this file?'
    )
    if (!confirmed) return

    try {
      await dispatch(deleteFile(fileId))
      toast.success('File has been deleted successfully.')
    } catch (error) {
      toast.error('Failed to delete file. Please try again.')
    }
  }

  const handlePageChange = (page: number) => {
    dispatch(fetchFiles({ page, limit: 10 }))
  }

  const fileTypes = [
    { value: '', label: 'All Files' },
    { value: 'image/', label: 'Images' },
    { value: 'application/pdf', label: 'PDF' },
    { value: 'text/', label: 'Text Files' },
    { value: 'application/msword', label: 'Documents' }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          My Files
        </CardTitle>

        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search files..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedFileType}
              onChange={(e) => dispatch(setSelectedFileType(e.target.value))}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              {fileTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No files found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onFileSelect?.(file.id)}
                >
                  <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium truncate"
                      title={file.originalName}
                    >
                      {truncateText(file.originalName, 40)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} •{' '}
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file.id, file.originalName)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(file.id)}
                    title="Delete"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Showing {files.length} of {pagination.total} files
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
