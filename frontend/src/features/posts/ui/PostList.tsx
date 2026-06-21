'use client'

import React, { FC, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useGetPostsQuery } from '@/entities/posts/api/posts.api'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PostCard } from './PostCard'

interface PostListProps {
  userId?: string
  onCreatePost?: () => void
  isShowCreateForm?: boolean
  className?: string
}

const PAGE_LIMIT = 20

/**
 * PostList component - Displays a list of posts with cursor pagination.
 * Server state is owned by RTK Query; cursor lives in local state to drive
 * the accumulating query cache (see posts.api merge strategy).
 */
export const PostList: FC<PostListProps> = ({ userId, className = '' }) => {
  const t = useTranslations('posts')

  const [cursor, setCursor] = useState<string | undefined>(undefined)

  // Reset pagination when switching the user filter so we never carry a cursor
  // from a different list into a fresh cache entry.
  useEffect(() => {
    setCursor(undefined)
  }, [userId])

  const { data, isFetching, isError, error, refetch } = useGetPostsQuery({
    userId,
    cursor,
    limit: PAGE_LIMIT
  })

  const posts = data?.data ?? []
  const hasMore = data?.pagination.hasMore ?? false
  const nextCursor = data?.pagination.nextCursor

  const handleLoadMore = useCallback(() => {
    if (hasMore && nextCursor && !isFetching) {
      setCursor(nextCursor)
    }
  }, [hasMore, nextCursor, isFetching])

  if (isError) {
    const message =
      error && 'message' in error ? error.message : 'Unknown error'
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading posts: {message}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
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
      <div className="space-y-4">
        {posts.length === 0 && !isFetching ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>{t('noPosts')}</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {isFetching && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">{t('loading')}</p>
            </CardContent>
          </Card>
        )}

        {hasMore && !isFetching && posts.length > 0 && (
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
