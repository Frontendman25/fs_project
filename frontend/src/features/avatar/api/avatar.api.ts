import { baseApi } from '@/shared/api/base-api'
import type { User } from '@/shared/types/api'

/**
 * Backend is inconsistent about where the new avatar URL lands, so callers
 * must defensively read all known shapes.
 */
export type AvatarUploadResult =
  | { url: string }
  | { avatarUrl: string }
  | { user: User }
  | { data?: { url?: string; avatarUrl?: string } }

export const avatarApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    uploadAvatar: build.mutation<
      AvatarUploadResult,
      { userId: string; formData: FormData }
    >({
      query: ({ userId, formData }) => ({
        url: `/api/users/${userId}/avatar`,
        method: 'upload',
        data: formData
      })
    }),

    deleteAvatar: build.mutation<void, string>({
      query: (userId) => ({
        url: `/api/users/${userId}/avatar`,
        method: 'delete'
      })
    })
  })
})

export const { useUploadAvatarMutation, useDeleteAvatarMutation } =
  avatarApiSlice
