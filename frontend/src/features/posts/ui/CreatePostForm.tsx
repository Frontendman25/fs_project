'use client'

import React, { FC, ChangeEvent, useState, FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '@/app/store'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { POST_CONSTANTS, UI_CONSTANTS } from '@/shared/constants'
import { TEST_IDS } from '@/shared/constants'

import { userSelectors } from '@/entities/user/model/userSelectors'
import { createPost } from '@/entities/posts/model/postsSlice'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CreatePostFormProps {
  onSuccess?: () => void
  className?: string
}

/**
 * CreatePostForm component - Form for creating new posts
 * Follows Feature-Sliced Design architecture
 */
export const CreatePostForm: FC<CreatePostFormProps> = ({
  onSuccess,
  className = ''
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(userSelectors.selectUser)

  const t = useTranslations('posts')

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!user) {
      toast.error(t('error.validation.notLoggedIn'))
      return
    }

    if (content.trim() === '') {
      toast.error(t('error.validation.emptyContent'))
      return
    }

    setIsSubmitting(true)

    try {
      await dispatch(
        createPost({
          userId: user.id,
          content: content.trim()
        })
      )

      setContent('')
      toast.success(t('success.created'))

      onSuccess?.()
    } catch {
      toast.error(t('error.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle content change with character limit
   */
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= POST_CONSTANTS.MAX_CONTENT_LENGTH) {
      setContent(value)
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          <p data-testid={TEST_IDS.createPostForm.authError}>
            {t('error.validation.notLoggedIn')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={handleContentChange}
              data-testid={TEST_IDS.createPostForm.contentInput}
              placeholder={t('edit.placeholder')}
              className={`min-h-[${UI_CONSTANTS.TEXTAREA_MIN_HEIGHT}] resize-none`}
              maxLength={POST_CONSTANTS.MAX_CONTENT_LENGTH}
              disabled={isSubmitting}
            />
            <p
              data-testid={TEST_IDS.createPostForm.characterCounter}
              className="text-xs text-gray-500 mt-2"
            >
              {content.length}/{POST_CONSTANTS.MAX_CONTENT_LENGTH} characters
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || content.trim() === ''}
              data-testid={TEST_IDS.createPostForm.submitButton}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? t('edit.creating') : t('createPost')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
