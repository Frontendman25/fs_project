/**
 * UI-related constants
 * Following Feature-Sliced Design - shared layer for cross-cutting concerns
 */

/**
 * UI configuration constants
 */
export const UI_CONSTANTS = {
  /**
   * Default minimum height for textarea components
   */
  TEXTAREA_MIN_HEIGHT: '120px',

  /**
   * Animation duration for loading states (in milliseconds)
   */
  LOADING_ANIMATION_DURATION: 500,

  /**
   * Toast notification duration (in milliseconds)
   */
  TOAST_DURATION: 3000
} as const

/**
 * Type for UI constants
 */
export type UIConstants = typeof UI_CONSTANTS
