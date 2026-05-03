'use client'

import React, { FC, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, X } from 'lucide-react'

import { POST_CONSTANTS } from '@/shared/constants'

import { AppDispatch } from '@/app/store'

import { userSelectors } from '@/entities/user/model/userSelectors'
import { getPosts } from '@/entities/posts/model/postsSlice'

import { Button } from '@/components/ui/button'

import { PostList } from '@/features/posts/ui/PostList'
import { CreatePostForm } from '@/features/posts/ui/CreatePostForm'

/**
 * PostsPage component — page UI shell for post management (App Router composes this from `app/[locale]/posts`).
 * Follows Feature-Sliced Design architecture
 */
export const PostsPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(userSelectors.selectUser)

  const [isShowCreateForm, setIsShowCreateForm] = useState(false)

  // Fetch posts on component mount
  useEffect(() => {
    dispatch(getPosts({ limit: POST_CONSTANTS.DEFAULT_POST_LIMIT }))
  }, [dispatch])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Posts</h1>
          <p className="text-gray-600">
            Share your thoughts and connect with others
          </p>
        </div>

        {/* Create Post Section */}
        {user && (
          <div>
            {isShowCreateForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Create New Post</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CreatePostForm onSuccess={() => setIsShowCreateForm(false)} />
              </div>
            ) : (
              <div className="flex justify-end text-center">
                <Button
                  onClick={() => setIsShowCreateForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create a Post
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Posts List */}
        <PostList
          userId={user?.id}
          onCreatePost={() => setIsShowCreateForm(true)}
          isShowCreateForm={isShowCreateForm}
        />
      </div>
    </div>
  )
}

export default PostsPage
