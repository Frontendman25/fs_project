/**
 * Posts Feature Barrel Export - Centralized exports for posts feature
 * Follows Feature-Sliced Design architecture
 * 
 * Only exports UI components from features layer.
 * Model (slice, thunks, selectors) should be imported directly from entities layer.
 */

// UI Components only
export { PostList } from './ui/PostList'
export { PostCard } from './ui/PostCard'
export { CreatePostForm } from './ui/CreatePostForm'
