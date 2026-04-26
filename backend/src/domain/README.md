# Domain Layer - Posts Module

This directory contains the core domain logic for the posts module following Clean Architecture principles.

## Structure

```
domain/
├── entities/
│   └── Post.ts                    # Core Post entity and related interfaces
├── repositories/
│   └── IPostRepository.ts         # Repository interface contract
├── errors/
│   └── AppError.ts                # Custom error classes
└── README.md                      # This file
```

## Entities

### Post.ts
- **Post**: Core domain entity representing a post
- **CreatePostData**: Input interface for creating posts
- **UpdatePostData**: Input interface for updating posts
- **PostWithUser**: Extended post entity with user information
- **CursorPaginationParams**: Pagination parameters for cursor-based pagination
- **CursorPaginationResult**: Paginated result structure

## Repositories

### IPostRepository.ts
Repository interface that defines the contract for data access operations:
- `create()` - Create a new post
- `findById()` - Find post by ID
- `findWithCursor()` - Find posts with cursor pagination
- `findWithUserAndCursor()` - Find posts with user info and pagination
- `update()` - Update a post
- `delete()` - Delete a post
- `countByUser()` - Count posts by user
- `existsAndBelongsToUser()` - Check post ownership


## Errors

### AppError.ts
Custom error classes for consistent error handling:
- **AppError**: Base error class with HTTP status mapping
- **ValidationError**: For input validation failures (400)
- **NotFoundError**: For resource not found (404)
- **UnauthorizedError**: For authentication failures (401)
- **ForbiddenError**: For authorization failures (403)
- **ConflictError**: For resource conflicts (409)
- **BadRequestError**: For malformed requests (400)
- **InternalServerError**: For unexpected server errors (500)

## Design Principles

1. **Dependency Rule**: Dependencies point inward - domain layer has no external dependencies
2. **Entity Focus**: Contains core business entities and rules
3. **Interface Segregation**: Repository interfaces define clear contracts
4. **Error Handling**: Custom error classes ensure consistent error responses
5. **Type Safety**: Full TypeScript coverage with strict typing