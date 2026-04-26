'use client'

import React, { FC, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AppDispatch } from '@/app/store'

import {
  selectPosts,
  selectPostsLoading,
  selectPostsError,
  selectHasMorePosts,
  selectNextCursor
} from '@/entities/posts/model/postsSelectors'
import { getPosts, clearError } from '@/entities/posts/model/postsSlice'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PostCard } from './PostCard'

interface PostListProps {
  userId?: string
  onCreatePost?: () => void
  isShowCreateForm?: boolean
  className?: string
}

/**
 * PostList component - Displays a list of posts with pagination
 * Follows Feature-Sliced Design architecture
 */
export const PostList: FC<PostListProps> = ({ userId, className = '' }) => {
  const dispatch = useDispatch<AppDispatch>()

  const t = useTranslations('posts')

  const posts = useSelector(selectPosts)
  const loading = useSelector(selectPostsLoading)
  const error = useSelector(selectPostsError)
  const hasMore = useSelector(selectHasMorePosts)
  const nextCursor = useSelector(selectNextCursor)

  /**
   * Load initial posts
   */
  useEffect(() => {
    // Only fetch posts if we have a valid userId or if we want all posts (no userId filter)
    if (userId !== undefined) {
      dispatch(getPosts({ userId, limit: 20 }))
    } else {
      // Fetch all posts if no specific userId is provided
      dispatch(getPosts({ limit: 20 }))
    }
  }, [dispatch, userId])

  /**
   * Load more posts for pagination
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && nextCursor && !loading) {
      dispatch(
        getPosts({
          userId,
          cursor: nextCursor,
          limit: 20,
          append: true
        })
      )
    }
  }, [dispatch, userId, hasMore, nextCursor, loading])

  /**
   * Clear error when component unmounts
   */
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading posts: {error}</p>
            <Button
              variant="outline"
              onClick={() => dispatch(getPosts({ userId, limit: 20 }))}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {/* <CardHeader className="flex justify-end mb-6">
        {!isShowCreateForm &&(
          <Button onClick={onCreatePost} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create a Post
          </Button>
        )}
      </CardHeader> */}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 && !loading ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>{t('noPosts')}</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {/* Loading indicator */}
        {loading && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">{t('loading')}</p>
            </CardContent>
          </Card>
        )}

        {/* Load more button */}
        {hasMore && !loading && posts.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="w-full"
            >
              Load More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
