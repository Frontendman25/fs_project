/**
 * Posts Entity Barrel Export - Centralized exports for posts entity
 * Follows Feature-Sliced Design architecture
 * 
 * Exports all model-related functionality (slice, thunks, selectors)
 * This is the single source of truth for posts model access
 */

// Redux slice and actions
export {
  postsReducer,
  clearPosts,
  clearCurrentPost,
  clearError
} from './model/postsSlice'

// Async thunks
export {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostCount
} from './model/postsSlice'

// Selectors
export {
  selectPosts,
  selectCurrentPost,
  selectPostCount,
  selectPostsLoading,
  selectPostsError,
  selectPostsPagination,
  selectHasMorePosts,
  selectNextCursor,
  selectPostsByUserId,
  selectPostById,
  selectPostsWithPagination,
  selectPostCountByUserId
} from './model/postsSelectors'