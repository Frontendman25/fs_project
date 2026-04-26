# Posts Entity - FSD Architecture

This directory contains the posts entity following Feature-Sliced Design (FSD) architecture principles.

## Structure

```
entities/posts/
├── model/
│   ├── postsSlice.ts              # Redux slice with separated domain/UI state
│   └── postsSelectors.ts          # Optimized selectors (minimal memoization)
├── index.ts                       # Barrel exports for entity
└── README.md                      # This file
```

## State Architecture

### Separated Domain Data and UI State

The Redux state is structured to clearly separate business data from UI concerns:

```typescript
interface IPostsState {
  data: {
    posts: PostWithUser[]           // Domain data
    currentPost: PostWithUser | null
    postCount: number
  },
  ui: {
    loading: boolean                // UI state
    error: string | null
    pagination: {
      hasMore: boolean
      nextCursor?: string
    }
  }
}
```

### Benefits of This Structure:

1. **Clear Separation**: Domain logic is separate from UI concerns
2. **Better Testing**: Can test domain logic independently
3. **Reusability**: Domain data can be used across different UI implementations
4. **Maintainability**: Changes to UI state don't affect domain logic

## Selectors Optimization

### Direct Access (No Memoization)
Simple primitive values that don't benefit from memoization:
- `selectPosts` - Direct array access
- `selectPostsLoading` - Boolean value
- `selectPostsError` - String or null
- `selectPostCount` - Number value

### Memoized Selectors
Only complex computations and filtering:
- `selectPostsByUserId` - Filtered array (expensive operation)
- `selectPostById` - Array.find operation
- `selectPostsWithPagination` - Combined data transformation

## Usage Examples

### Importing from Entity Layer

```typescript
// ✅ Correct - Import from entities layer
import { 
  selectPosts, 
  createPost, 
  getPosts 
} from '@/entities/posts'

// ❌ Incorrect - Don't import from features layer
import { selectPosts } from '@/features/posts'
```

### Using Selectors

```typescript
// Simple selectors (no memoization needed)
const posts = useSelector(selectPosts)
const loading = useSelector(selectPostsLoading)

// Complex selectors (memoized for performance)
const userPosts = useSelector(state => selectPostsByUserId(state, userId))
const specificPost = useSelector(state => selectPostById(state, postId))
```

## Design Principles

1. **Entity Focus**: Contains only posts-related business logic
2. **State Separation**: Clear distinction between domain data and UI state
3. **Performance**: Minimal memoization for optimal performance
4. **Single Source**: All posts model functionality in one place
5. **Clean Exports**: Barrel exports for easy importing