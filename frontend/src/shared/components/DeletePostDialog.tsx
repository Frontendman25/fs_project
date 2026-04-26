'use client'

import React, { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TEST_IDS } from '@/shared/constants'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeletePostDialogProps {
  onConfirm: () => void
  isLoading?: boolean
  children: ReactNode
}

export function DeletePostDialog({
  onConfirm,
  isLoading = false,
  children
}: DeletePostDialogProps) {
  const [open, setOpen] = React.useState(false)

  const t = useTranslations('posts.delete')

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        data-testid={TEST_IDS.deletePostDialog.content}
        className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            data-testid={TEST_IDS.deletePostDialog.cancelButton}
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            data-testid={TEST_IDS.deletePostDialog.confirmButton}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <p>{t('deleting')}</p>
              </>
            ) : (
              <div className="flex items-center justify-center">
                <Trash2 className="mr-2 h-4 w-4" />
                <p>{t('confirm')}</p>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
