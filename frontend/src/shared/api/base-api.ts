import { createApi } from '@reduxjs/toolkit/query/react'

import { axiosBaseQuery } from './base-query'

/**
 * Root RTK Query API. Domain endpoints are attached via `injectEndpoints`
 * (see the per-entity api modules) to keep this layer free of business
 * concerns and avoid one monolithic endpoints file.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Posts', 'PostCount', 'Files', 'StorageStats'],
  endpoints: () => ({})
})
