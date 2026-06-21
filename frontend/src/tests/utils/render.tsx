import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import { type RootState } from '@/app/store'
import { baseApi } from '@/shared/api/base-api'
import { authReducer } from '@/entities/auth/model/authSlice'

// ─── Store factory ────────────────────────────────────────────────────────────
//
// Creates a fresh store per test to prevent state leaking between tests.
// Mirrors the production store (auth slice + RTK Query api) so component hooks
// (useGetPostsQuery, mutations, …) work against MSW.
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type TestPreloadedState = DeepPartial<RootState>

export function makeTestStore(preloadedState?: TestPreloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: preloadedState as RootState
  })
}

export type TestStore = ReturnType<typeof makeTestStore>

// ─── Custom render ────────────────────────────────────────────────────────────

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: TestPreloadedState
}

/**
 * Renders a component inside a real Redux Provider backed by a fresh test store.
 * Returns everything `@testing-library/react render` returns, plus the `store`
 * instance for advanced assertions.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState, ...options }: RenderWithProvidersOptions = {}
) {
  const store = makeTestStore(preloadedState)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), store }
}
