'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Pencil, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { setAvatarUrl } from '@/entities/auth/model/authSlice'
import {
  useUploadAvatarMutation,
  useDeleteAvatarMutation
} from '@/features/avatar/api/avatar.api'
import { cn } from '@/shared/lib/utils'
import { AvatarUploaderProps } from '../model/types'
import { AvatarViewer } from './AvatarViewer'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

/**
 * Default avatar component for users without an avatar
 * Uses a simple gradient background with user's initial
 */
const DefaultAvatar: React.FC<{ username?: string; size: string }> = ({
  username,
  size
}) => {
  const initial = username?.charAt(0).toUpperCase() || 'U'

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold',
        size
      )}
    >
      {initial}
    </div>
  )
}

/**
 * Avatar uploader component with modern UX patterns.
 * Features hover overlay with edit icon, automatic upload, and loading states.
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  avatarUrl,
  username,
  className,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/jpeg,image/png,image/webp',
  size = 'default'
}) => {
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploadAvatar, { isLoading: loading }] = useUploadAvatarMutation()
  const [deleteAvatar, { isLoading: isDeleting }] = useDeleteAvatarMutation()

  const [error, setError] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Size classes for different avatar sizes
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  }

  /**
   * Handles file selection and automatic upload
   */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setError(null)

      // Validate file type
      if (!accept.split(',').some((type) => file.type === type.trim())) {
        setError('Unsupported file type. Please use JPEG, PNG, or WebP.')
        return
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(
          `File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
        )
        return
      }

      try {
        const formData = new FormData()
        formData.append('avatar', file)

        const result = await uploadAvatar({ userId, formData }).unwrap()

        // Backend response shape is inconsistent; read all known locations.
        const responseData = result as Record<string, unknown>
        const newAvatarUrl =
          (responseData?.avatarUrl as string) ||
          (responseData?.url as string) ||
          ((responseData?.user as Record<string, unknown>)?.avatarUrl as string)

        if (!newAvatarUrl) {
          throw new Error('Avatar URL not returned by server')
        }

        dispatch(setAvatarUrl(newAvatarUrl))
        toast.success('Avatar updated', {
          description: 'Your profile picture has been updated successfully.'
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : ((err as { message?: string })?.message ??
              'Unknown error occurred')
        setError(errorMessage)
        toast.error('Upload failed', {
          description: errorMessage
        })
      } finally {
        // Clear the input
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    },
    [accept, maxSize, dispatch, userId, uploadAvatar]
  )

  /**
   * Handles avatar deletion
   */
  const handleDeleteAvatar = useCallback(async () => {
    if (!userId) return

    try {
      await deleteAvatar(userId).unwrap()
      dispatch(setAvatarUrl(null))
      toast.success('Avatar deleted successfully')
      setIsDeleteDialogOpen(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? 'Unknown error occurred')
      toast.error('Failed to delete avatar', {
        description: errorMessage
      })
    }
  }, [userId, dispatch, deleteAvatar])

  /**
   * Triggers file input click
   */
  const handleAvatarClick = () => {
    if (!loading && !isDeleting) {
      inputRef.current?.click()
    }
  }

  /**
   * Opens avatar viewer
   */
  const handleViewAvatar = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (avatarUrl) {
      setIsViewerOpen(true)
    }
  }

  /**
   * Opens delete confirmation dialog
   */
  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={loading}
      />

      {/* Avatar with hover overlay */}
      <div
        className="group relative cursor-pointer"
        onClick={handleAvatarClick}
      >
        <Avatar
          className={cn(
            'ring-2 ring-transparent transition-all duration-200',
            sizeClasses[size]
          )}
        >
          <AvatarImage
            src={avatarUrl || undefined}
            alt={`${username || 'User'} avatar`}
          />
          <AvatarFallback>
            <DefaultAvatar username={username} size={sizeClasses[size]} />
          </AvatarFallback>
        </Avatar>

        {/* Hover overlay with action buttons */}
        {avatarUrl ? (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
              sizeClasses[size]
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/20 text-white hover:bg-white/30"
              onClick={handleViewAvatar}
              title="View avatar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/20 text-white hover:bg-red-500/70"
              onClick={handleDeleteClick}
              title="Delete avatar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
              sizeClasses[size]
            )}
          >
            <Pencil className={cn('text-white', iconSizeClasses[size])} />
          </div>
        )}

        {/* Loading overlay */}
        {(loading || isDeleting) && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-black/50',
              sizeClasses[size]
            )}
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {/* Avatar Viewer Modal */}
      {avatarUrl && (
        <AvatarViewer
          avatarUrl={avatarUrl}
          username={username}
          isOpen={isViewerOpen}
          suppressClose={isDeleteDialogOpen}
          onClose={() => setIsViewerOpen(false)}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Avatar"
        message="Are you sure you want to delete your avatar? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAvatar}
      />
    </div>
  )
}

export default AvatarUploader
