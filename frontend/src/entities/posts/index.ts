/**
 * Posts Entity Barrel Export
 * Server state is owned by RTK Query (see ./api/posts.api).
 */

export {
  postsApi,
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostCountQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation
} from './api/posts.api'
export type { GetPostsArgs } from './api/posts.api'

export type {
  Post,
  PostWithUser,
  CreatePostDTO,
  UpdatePostDTO,
  PaginatedPostsResponse
} from '@/shared/api/posts'
