# Application Layer - Posts Module

This directory contains the application logic for the posts module following Clean Architecture principles.

## Structure

```
application/
├── dtos/
│   └── PostDTOs.ts                # Data Transfer Objects with Zod validation
├── use-cases/
│   ├── post/
│   │   ├── CreatePostUseCase.ts   # Post creation business logic
│   │   ├── GetPostsUseCase.ts     # Post retrieval with pagination
│   │   ├── GetPostByIdUseCase.ts  # Single post retrieval
│   │   ├── UpdatePostUseCase.ts   # Post update business logic
│   │   ├── DeletePostUseCase.ts   # Post deletion business logic
│   │   ├── GetPostCountUseCase.ts # Post count retrieval
│   │   └── index.ts               # Barrel exports
│   └── index.ts                   # Main use cases barrel
└── README.md                      # This file
```

## DTOs

### PostDTOs.ts
Data Transfer Objects with Zod validation schemas:
- **CreatePostDTOSchema**: Validates post creation input
- **UpdatePostDTOSchema**: Validates post update input
- **GetPostsQueryDTOSchema**: Validates pagination query parameters
- **PostIdParamSchema**: Validates post ID parameters
- **UserIdParamSchema**: Validates user ID parameters

## Use Cases

Each use case follows the same pattern with a standardized `.execute()` method:

### CreatePostUseCase
- **Purpose**: Handles post creation business logic
- **Input**: `CreatePostUseCaseInput` with raw data for validation
- **Output**: `CreatePostUseCaseOutput` with created post
- **Validation**: Uses Zod schema validation
- **Error Handling**: Throws ValidationError for invalid input

### GetPostsUseCase
- **Purpose**: Handles post retrieval with cursor pagination
- **Input**: `GetPostsUseCaseInput` with query parameters
- **Output**: `GetPostsUseCaseOutput` with paginated posts and user info
- **Features**: Supports cursor-based pagination, user filtering

### GetPostByIdUseCase
- **Purpose**: Handles single post retrieval
- **Input**: `GetPostByIdUseCaseInput` with post ID parameters
- **Output**: `GetPostByIdUseCaseOutput` with post data
- **Error Handling**: Throws NotFoundError if post doesn't exist

### UpdatePostUseCase
- **Purpose**: Handles post update business logic
- **Input**: `UpdatePostUseCaseInput` with post ID, update data, and user ID
- **Output**: `UpdatePostUseCaseOutput` with updated post
- **Authorization**: Checks post ownership before update
- **Error Handling**: Throws ForbiddenError for unauthorized access

### DeletePostUseCase
- **Purpose**: Handles post deletion business logic
- **Input**: `DeletePostUseCaseInput` with post ID and user ID
- **Output**: `DeletePostUseCaseOutput` with success status
- **Authorization**: Checks post ownership before deletion
- **Error Handling**: Throws ForbiddenError for unauthorized access

### GetPostCountUseCase
- **Purpose**: Handles post count retrieval for a user
- **Input**: `GetPostCountUseCaseInput` with user ID parameters
- **Output**: `GetPostCountUseCaseOutput` with post count
- **Validation**: Uses Zod schema validation

## Design Principles

1. **Single Responsibility**: Each use case handles one specific business operation
2. **Standardized Interface**: All use cases follow the same `.execute()` pattern
3. **Input Validation**: Zod schemas ensure type-safe validation
4. **Error Handling**: Custom error classes for consistent error responses
5. **Authorization**: Business rules enforced at the application layer
6. **Testability**: Easy to mock and test individual use cases
7. **Dependency Injection**: Use cases depend on repository interfaces, not implementations

## Usage Example

```typescript
// Initialize use case with repository dependency
const createPostUseCase = new CreatePostUseCase(postRepository)

// Execute use case with input validation
const result = await createPostUseCase.execute({
  data: { userId: 'user123', content: 'Hello world!' }
})

// Handle result
console.log(result.post) // Created post data
```

## Benefits

1. **Clean Separation**: Business logic separated from infrastructure concerns
2. **Reusability**: Use cases can be used by different presentation layers
3. **Testability**: Easy to unit test with mocked repositories
4. **Maintainability**: Changes to business rules isolated to specific use cases
5. **Type Safety**: Full TypeScript coverage with strict typing
6. **Error Consistency**: Standardized error handling across all operations