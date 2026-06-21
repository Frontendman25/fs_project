'use client'

import React, { ChangeEvent, FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { Edit, Trash2, Save, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { selectUser } from '@/entities/auth/model/authSelectors'
import {
  useUpdatePostMutation,
  useDeletePostMutation
} from '@/entities/posts/api/posts.api'

import { PostWithUser } from '@/shared/api/posts'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { DeletePostDialog } from '@/shared/components/DeletePostDialog'

interface PostCardProps {
  post: PostWithUser
  className?: string
}

/**
 * PostCard component - Displays a single post with edit/delete functionality
 * Follows Feature-Sliced Design architecture
 */
export const PostCard: FC<PostCardProps> = ({ post, className = '' }) => {
  const user = useSelector(selectUser)
  const [updatePost, { isLoading: isSubmitting }] = useUpdatePostMutation()
  const [deletePost] = useDeletePostMutation()

  const t = useTranslations('posts')

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)

  // Check if current user owns this post
  const isOwner = Boolean(user && user.id === post.userId)

  /**
   * Handle post update
   */
  const handleUpdate = async () => {
    if (!isOwner || !user) return

    if (editContent.trim() === '') {
      toast.error(t('error.validation.emptyContent'))
      return
    }

    try {
      await updatePost({
        id: post.id,
        data: { content: editContent.trim() },
        userId: user.id
      }).unwrap()

      setIsEditing(false)
      toast.success(t('success.updated'))
    } catch {
      toast.error(t('error.updateFailed'))
    }
  }

  /**
   * Handle post deletion
   */
  const handleDelete = async () => {
    if (!isOwner || !user) return

    try {
      await deletePost(post.id).unwrap()

      toast.success(t('success.deleted'))
    } catch {
      toast.error(t('error.deleteFailed'))
    }
  }

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setEditContent(post.content)
    setIsEditing(false)
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{post?.user?.username}</p>
              <p className="text-xs text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {isOwner ? (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DeletePostDialog onConfirm={handleDelete}>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeletePostDialog>
                </>
              )}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setEditContent(event.target.value)
            }
            className="min-h-[100px] resize-none"
            placeholder="What's on your mind?"
            maxLength={2000}
          />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        )}

        {isEditing && (
          <p className="text-xs text-gray-500 mt-2">
            {editContent.length}/2000 characters
          </p>
        )}
      </CardContent>
    </Card>
  )
}
