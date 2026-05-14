'use client'

import React from 'react'
import { X, Download, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

/**
 * Props for the AvatarViewer component
 */
interface AvatarViewerProps {
  /** Avatar URL to display */
  avatarUrl: string
  /** Username for alt text */
  username?: string
  /** Whether the viewer is open */
  isOpen: boolean
  /** Callback when viewer should be closed */
  onClose: () => void
  /** Callback when delete is requested */
  onDelete?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Avatar viewer component for displaying full-size avatar images.
 * Provides a modal-like overlay with zoom functionality and actions.
 * Follows the classic social media approach for image viewing.
 */
export const AvatarViewer: React.FC<AvatarViewerProps> = ({
  avatarUrl,
  username,
  isOpen,
  onClose,
  onDelete,
  className
}) => {
  const handleDownload = React.useCallback(() => {
    if (!avatarUrl) return
    const link = document.createElement('a')
    link.href = avatarUrl
    link.download = `${username || 'avatar'}-avatar.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [avatarUrl, username])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !avatarUrl) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-10 bg-black/50 text-white hover:bg-black/70"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Action buttons */}
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={handleDownload}
          title="Download avatar"
        >
          <Download className="h-5 w-5" />
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-red-600/70"
            onClick={onDelete}
            title="Delete avatar"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Image container */}
      <div
        className="relative max-h-[90vh] max-w-[90vw] cursor-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={avatarUrl}
          alt={`${username || 'User'} avatar`}
          width={800}
          height={800}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        />
      </div>

      {/* Click hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        Click outside to close • ESC to close
      </div>
    </div>
  )
}

export default AvatarViewer
