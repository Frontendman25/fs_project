import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../../../app/store'

/**
 * Select posts state
 */
export const selectPostsState = (state: RootState) => state.posts

// Direct access selectors for simple values (no memoization needed)
// These are trivial primitive values that don't benefit from memoization

/**
 * Select all posts
 */
export const selectPosts = (state: RootState) => state.posts.data.posts

/**
 * Select current post
 */
export const selectCurrentPost = (state: RootState) =>
  state.posts.data.currentPost

/**
 * Select post count
 */
export const selectPostCount = (state: RootState) => state.posts.data.postCount

/**
 * Select loading state
 */
export const selectPostsLoading = (state: RootState) => state.posts.ui.loading

/**
 * Select error state
 */
export const selectPostsError = (state: RootState) => state.posts.ui.error

/**
 * Select pagination info
 */
export const selectPostsPagination = (state: RootState) =>
  state.posts.ui.pagination || { hasMore: false }

/**
 * Select if there are more posts to load
 */
export const selectHasMorePosts = (state: RootState) =>
  state.posts.ui.pagination?.hasMore || false

/**
 * Select next cursor for pagination
 */
export const selectNextCursor = (state: RootState) =>
  state.posts?.ui?.pagination?.nextCursor || undefined

// Memoized selectors for derived/computed data
// Only use createSelector for complex computations or filtering

/**
 * Select posts by user ID (memoized for performance)
 */
export const selectPostsByUserId = createSelector(
  [selectPosts, (state: RootState, userId: string) => userId],
  (posts, userId) => posts.filter((post) => post.user.id === userId)
)

/**
 * Select post by ID (memoized for performance)
 */
export const selectPostById = createSelector(
  [selectPosts, (state: RootState, id: string) => id],
  (posts, id) => posts.find((post) => post.id === id)
)

/**
 * Select posts with pagination info (memoized for performance)
 */
export const selectPostsWithPagination = createSelector(
  [selectPosts, selectNextCursor, selectHasMorePosts],
  (posts, nextCursor, hasMore) => ({
    posts,
    pagination: {
      nextCursor,
      hasMore
    }
  })
)

/**
 * Select posts count by user (memoized for performance)
 */
export const selectPostCountByUserId = createSelector(
  [selectPostsByUserId],
  (posts) => posts.length
)
