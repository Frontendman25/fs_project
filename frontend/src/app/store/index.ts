'use client'

import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { authReducer } from '@/entities/auth/model/authSlice'
import { filesReducer } from '@/entities/files/model/filesSlice'
import { userReducer } from '@/entities/user/model/userSlice'
import { postsReducer } from '@/entities/posts/model/postsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: filesReducer,
    user: userReducer,
    posts: postsReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
