import { baseApi } from '@/shared/api/base-api'
import type {
  Post,
  PostWithUser,
  CreatePostDTO,
  UpdatePostDTO,
  PaginatedPostsResponse
} from '@/shared/api/posts'

export interface GetPostsArgs {
  userId?: string
  cursor?: string
  limit?: number
}

const buildPostsUrl = ({ userId, cursor, limit }: GetPostsArgs): string => {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (cursor) params.append('cursor', cursor)
  if (limit) params.append('limit', String(limit))
  const qs = params.toString()
  return qs ? `/api/posts?${qs}` : '/api/posts'
}

/**
 * Posts server-state via RTK Query. Replaces the former createAsyncThunk + slice.
 *
 * Cursor pagination uses a single accumulating cache entry keyed by `userId`
 * (serializeQueryArgs drops `cursor`), with `merge` appending pages and
 * `forceRefetch` triggering a fetch whenever the cursor changes.
 */
export const postsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPosts: build.query<PaginatedPostsResponse, GetPostsArgs | void>({
      query: (args) => ({ url: buildPostsUrl(args ?? {}), method: 'get' }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${queryArgs?.userId ?? 'all'})`,
      merge: (current, incoming, { arg }) => {
        if (arg?.cursor) {
          current.data.push(...incoming.data)
          current.pagination = incoming.pagination
          return current
        }
        return incoming
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((post) => ({
                type: 'Posts' as const,
                id: post.id
              })),
              { type: 'Posts' as const, id: 'LIST' }
            ]
          : [{ type: 'Posts' as const, id: 'LIST' }]
    }),

    getPostById: build.query<Post, string>({
      query: (id) => ({ url: `/api/posts/${id}`, method: 'get' }),
      providesTags: (_result, _error, id) => [{ type: 'Posts', id }]
    }),

    getPostCount: build.query<number, string>({
      query: (userId) => ({ url: `/api/posts/count/${userId}`, method: 'get' }),
      transformResponse: (response: { count: number }) => response.count,
      providesTags: (_result, _error, userId) => [
        { type: 'PostCount', id: userId }
      ]
    }),

    createPost: build.mutation<Post, CreatePostDTO>({
      query: (data) => ({ url: '/api/posts', method: 'post', data }),
      invalidatesTags: [
        { type: 'Posts', id: 'LIST' },
        { type: 'PostCount', id: 'LIST' }
      ]
    }),

    updatePost: build.mutation<
      Post,
      { id: string; data: UpdatePostDTO; userId: string }
    >({
      query: ({ id, data, userId }) => ({
        url: `/api/posts/${id}`,
        method: 'put',
        data: { ...data, userId }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Posts', id },
        { type: 'Posts', id: 'LIST' }
      ]
    }),

    deletePost: build.mutation<void, string>({
      query: (id) => ({ url: `/api/posts/${id}`, method: 'delete' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Posts', id },
        { type: 'Posts', id: 'LIST' },
        { type: 'PostCount', id: 'LIST' }
      ]
    })
  })
})

export type { PostWithUser }

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostCountQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation
} = postsApi
