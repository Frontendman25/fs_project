# Posts Feature - FSD Architecture

This directory contains the posts feature following Feature-Sliced Design (FSD) architecture principles.

## Structure

```
features/posts/
├── ui/
│   ├── PostList.tsx               # Posts list component with infinite scroll
│   ├── PostCard.tsx              # Individual post display component
│   └── CreatePostForm.tsx         # Post creation form component
├── index.ts                      # Barrel exports (UI components only)
└── README.md                     # This file
```

## FSD Principles

### ✅ What This Layer Contains:
- **UI Components**: React components for posts functionality
- **User Interactions**: Form handling, event callbacks
- **Component Logic**: Component-specific state and behavior

### ❌ What This Layer Does NOT Contain:
- **Business Logic**: Redux slices, thunks, selectors (belongs in entities)
- **Data Management**: State management logic (belongs in entities)
- **API Calls**: Direct API interactions (belongs in shared/api)

## Component Architecture

### PostList Component
- **Purpose**: Displays paginated list of posts
- **Features**: Infinite scrolling, loading states, error handling
- **Dependencies**: Uses entities/posts for data access

### PostCard Component
- **Purpose**: Displays individual post with metadata
- **Features**: User info, timestamp, content display
- **Dependencies**: Pure presentation component

### CreatePostForm Component
- **Purpose**: Form for creating new posts
- **Features**: Validation, submission handling, loading states
- **Dependencies**: Uses entities/posts for actions

## Usage Examples

### Importing Components

```typescript
// ✅ Correct - Import UI components from features
import { PostList, PostCard, CreatePostForm } from '@/features/posts'

// ✅ Correct - Import model from entities
import { selectPosts, createPost } from '@/entities/posts'
```

### Component Usage

```typescript
// In a page component
import { PostList, CreatePostForm } from '@/features/posts'
import { selectPosts } from '@/entities/posts'

export const PostsPage = () => {
  return (
    <div>
      <CreatePostForm />
      <PostList />
    </div>
  )
}
```

## Design Principles

1. **UI Focus**: Only contains presentation logic and user interactions
2. **No Business Logic**: All business logic delegated to entities layer
3. **Component Composition**: Components are composable and reusable
4. **Clean Exports**: Only exports UI components, not model logic
5. **Separation of Concerns**: Clear boundaries between UI and business logic

## Dependencies

### Internal Dependencies:
- `@/entities/posts` - For Redux state and actions
- `@/shared/ui` - For reusable UI components
- `@/shared/api` - For API client (used by entities)

### External Dependencies:
- `react` - React framework
- `@reduxjs/toolkit` - Redux state management (via entities)
- `lucide-react` - Icons
- `date-fns` - Date formatting