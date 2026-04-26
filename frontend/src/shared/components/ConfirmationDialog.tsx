'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { TEST_IDS } from '@/shared/constants'

import { Button } from '@/components/ui/button'

/**
 * Props for the ConfirmationDialog component
 */
interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Dialog title */
  title: string
  /** Dialog message/description */
  message: string
  /** Confirm button text */
  confirmText?: string
  /** Cancel button text */
  cancelText?: string
  /** Whether the action is destructive (red button) */
  isDestructive?: boolean
  /** Whether the confirm button is loading */
  isLoading?: boolean
  /** Callback when dialog should be closed */
  onClose: () => void
  /** Callback when user confirms the action */
  onConfirm: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Confirmation dialog component for destructive actions.
 * Provides a modal-like overlay with confirmation options.
 * Follows modern UX patterns for critical actions.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onClose,
  onConfirm,
  className
}) => {
  /**
   * Handle escape key press
   */
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  if (!isOpen) return null

  return (
    <div
      data-testid={TEST_IDS.confirmationDialog.overlay}
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
    >
      <div
        data-testid={TEST_IDS.confirmationDialog.panel}
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          data-testid={TEST_IDS.confirmationDialog.closeButton}
          className="absolute right-2 top-2 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isDestructive
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid={TEST_IDS.confirmationDialog.cancelButton}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            data-testid={TEST_IDS.confirmationDialog.confirmButton}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
