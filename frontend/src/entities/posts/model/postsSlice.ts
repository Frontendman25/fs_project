import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

import {
  postsApi,
  PostWithUser,
  CreatePostDTO,
  UpdatePostDTO
} from '../../../shared/api/posts'
import {
  safeValidateCreatePost,
  safeValidateUpdatePost,
  safeValidateGetPostsQuery,
  safeValidatePostId,
  safeValidateUserId
} from '../../../shared/lib/validation/postValidation'

/**
 * Generic validation handler for async thunks
 * Reduces code duplication in validation error handling
 */
const handleValidation = <T>(
  validation: {
    success: boolean
    error?: { issues: Array<{ path: unknown[]; message: string }> }
    data?: T
  },
  operationName: string
): T | never => {
  if (!validation.success) {
    const errorMessage = validation.error?.issues
      .map(
        (err: { path: unknown[]; message: string }) =>
          `${err.path.join('.')}: ${err.message}`
      )
      .join(', ')
    throw new Error(`${operationName} validation failed: ${errorMessage}`)
  }

  return validation.data as T
}

/**
 * Domain data interface - Pure business data
 */
interface PostsDomainData {
  posts: PostWithUser[]
  currentPost: PostWithUser | null
  postCount: number
}

/**
 * UI state interface - UI-specific state
 */
interface PostsUIState {
  loading: boolean
  error: string | null
  pagination: {
    hasMore: boolean
    nextCursor?: string
  }
}

/**
 * Posts state interface - Separated domain data and UI state
 */
interface IPostsState {
  data: PostsDomainData
  ui: PostsUIState
}

/**
 * Initial state for posts slice
 */
const initialState: IPostsState = {
  data: {
    posts: [],
    currentPost: null,
    postCount: 0
  },
  ui: {
    loading: false,
    error: null,
    pagination: {
      hasMore: false
    }
  }
}

/**
 * Create post async thunk
 */
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (data: CreatePostDTO, { rejectWithValue }) => {
    try {
      // Validate input data using centralized validation
      // const validation = safeValidateCreatePost(data)
      // handleValidation(validation, 'Create post')
      const response = await postsApi.createPost(data)
      if (response.success && response.data) {
        return response.data
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Get posts with pagination async thunk
 */
export const getPosts = createAsyncThunk(
  'posts/getPosts',
  async (
    params: {
      userId?: string
      cursor?: string
      limit?: number
      append?: boolean
    } = {},
    { rejectWithValue }
  ) => {
    try {
      // Validate input data using centralized validation
      const validation = safeValidateGetPostsQuery(params)
      handleValidation(validation, 'Get posts query')

      const response = await postsApi.getPosts({
        userId: params.userId,
        cursor: params.cursor,
        limit: params.limit
      })

      if (response.success && response.data) {
        return {
          posts: response.data,
          pagination: response.pagination,
          append: params.append || false
        }
      }

      throw new Error(response.error || 'Failed to get posts')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Get post by ID async thunk
 */
export const getPostById = createAsyncThunk(
  'posts/getPostById',
  async (id: string, { rejectWithValue }) => {
    try {
      // Validate input data using centralized validation
      const validation = safeValidatePostId(id)
      handleValidation(validation, 'Post ID')

      const response = await postsApi.getPostById(id)
      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.error || 'Failed to get post')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Update post async thunk
 */
export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async (
    { id, data, userId }: { id: string; data: UpdatePostDTO; userId: string },
    { rejectWithValue }
  ) => {
    try {
      // Validate input data using centralized validation
      const postIdValidation = safeValidatePostId(id)
      handleValidation(postIdValidation, 'Post ID')

      const updateDataValidation = safeValidateUpdatePost(data)
      handleValidation(updateDataValidation, 'Update post data')

      const userIdValidation = safeValidateUserId(userId)
      handleValidation(userIdValidation, 'User ID')

      const response = await postsApi.updatePost(id, data, userId)
      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.error || 'Failed to update post')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Delete post async thunk
 */
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: string, { rejectWithValue }) => {
    try {
      // Validate input data using centralized validation
      const validation = safeValidatePostId(id)
      handleValidation(validation, 'Post ID')
      console.log('id in delete post', id)
      const response = await postsApi.deletePost(id)
      console.log('id in delete post response', response)
      if (response.success) {
        return id
      }

      throw new Error(response.error || 'Failed to delete post')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Get post count async thunk
 */
export const getPostCount = createAsyncThunk(
  'posts/getPostCount',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Validate input data using centralized validation
      const validation = safeValidateUserId(userId)
      handleValidation(validation, 'User ID')

      const response = await postsApi.getPostCount(userId)
      if (response.success && response.data) {
        return response.data.count
      }

      throw new Error(response.error || 'Failed to get post count')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
)

/**
 * Posts slice
 */
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.data.posts = []
      state.ui.pagination = { hasMore: false }
      state.ui.error = null
    },
    clearCurrentPost: (state) => {
      state.data.currentPost = null
      state.ui.error = null
    },
    clearError: (state) => {
      state.ui.error = null
    }
  },
  extraReducers: (builder) => {
    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.ui.loading = false
        // Ensure posts array exists before unshift
        if (!state.data.posts) {
          state.data.posts = []
        }
        // Add new post to the beginning of the list
        state.data.posts.unshift(action.payload as PostWithUser)
      })
      .addCase(createPost.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })

    // Get posts
    builder
      .addCase(getPosts.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(
        getPosts.fulfilled,
        (
          state,
          action: PayloadAction<{
            posts: PostWithUser[]
            pagination: { hasMore: boolean; nextCursor?: string }
            append: boolean
          }>
        ) => {
          state.ui.loading = false
          console.log('action.payload', action.payload)
          if (action.payload.append) {
            // Append to existing posts for pagination
            state.data.posts.push(...action.payload.posts)
          } else {
            // Replace posts for new search/filter
            state.data.posts = action.payload.posts
          }
          state.ui.pagination = action.payload.pagination
        }
      )
      .addCase(getPosts.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })

    // Get post by ID
    builder
      .addCase(getPostById.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(getPostById.fulfilled, (state, action) => {
        state.ui.loading = false
        state.data.currentPost = action.payload as PostWithUser
      })
      .addCase(getPostById.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })

    // Update post
    builder
      .addCase(updatePost.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.ui.loading = false
        const updatedPost = action.payload as PostWithUser
        // Update post in the list
        const index = state.data.posts.findIndex(
          (post) => post.id === updatedPost.id
        )
        if (index !== -1) {
          state.data.posts[index] = updatedPost
        }
        // Update current post if it's the same
        if (state.data.currentPost?.id === updatedPost.id) {
          state.data.currentPost = updatedPost
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })

    // Delete post
    builder
      .addCase(deletePost.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.ui.loading = false
        const deletedId = action.payload as string
        // Remove post from the list
        state.data.posts = state.data.posts.filter(
          (post) => post.id !== deletedId
        )
        // Clear current post if it was deleted
        if (state.data.currentPost?.id === deletedId) {
          state.data.currentPost = null
        }
        // Decrease post count
        state.data.postCount = Math.max(0, state.data.postCount - 1)
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })

    // Get post count
    builder
      .addCase(getPostCount.pending, (state) => {
        state.ui.loading = true
        state.ui.error = null
      })
      .addCase(getPostCount.fulfilled, (state, action) => {
        state.ui.loading = false
        state.data.postCount = action.payload as number
      })
      .addCase(getPostCount.rejected, (state, action) => {
        state.ui.loading = false
        state.ui.error = action.payload as string
      })
  }
})

export const { clearPosts, clearCurrentPost, clearError } = postsSlice.actions
export const postsReducer = postsSlice.reducer
