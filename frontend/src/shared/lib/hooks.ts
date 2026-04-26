/**
 * @fileoverview Typed Redux hooks
 * @description Pre-typed versions of useDispatch and useSelector hooks
 * @layer shared
 */

import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '../../app/store'

/**
 * Typed version of useDispatch hook
 * Use throughout your app instead of plain useDispatch
 */
export const useAppDispatch = () => useDispatch<AppDispatch>()

/**
 * Typed version of useSelector hook
 * Use throughout your app instead of plain useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
