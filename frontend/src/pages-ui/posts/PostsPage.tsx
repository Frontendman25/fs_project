'use client'

import React, { FC, useState } from 'react'
import { useSelector } from 'react-redux'
import { Plus, X } from 'lucide-react'

import { selectUser } from '@/entities/auth/model/authSelectors'

import { Button } from '@/components/ui/button'

import { PostList } from '@/features/posts/ui/PostList'
import { CreatePostForm } from '@/features/posts/ui/CreatePostForm'

/**
 * PostsPage component — page UI shell for post management (App Router composes this from `app/[locale]/posts`).
 * Follows Feature-Sliced Design architecture
 */
export const PostsPage: FC = () => {
  const user = useSelector(selectUser)

  const [isShowCreateForm, setIsShowCreateForm] = useState(false)

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
