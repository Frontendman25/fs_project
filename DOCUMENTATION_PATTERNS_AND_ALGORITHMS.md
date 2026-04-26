# Design patterns, data structures, and algorithms

This document maps **Gang of Four** and **architectural** patterns, **data structures**, **algorithms**, and **frontend** techniques to concrete locations and examples in the FS project codebase. It is a learning aid, not a normative spec—adjust paths if the repo evolves.

## Table of contents

1. [GoF design patterns](#gof-design-patterns)
2. [Architectural patterns](#architectural-patterns)
3. [Data structures](#data-structures)
4. [Algorithms](#algorithms)
5. [Frontend patterns](#frontend-patterns)

---

## GoF design patterns

### 1. ABSTRACT FACTORY

**Intent:** Provide an interface to create *families* of related objects without tying callers to concrete classes.

**Where:** `backend/src/infrastructure/database/factories/`

```typescript
// PostgreSQLDatabaseFactory and MongoDBDatabaseFactory implement IDatabaseFactory

interface IDatabaseFactory {
  getUserRepository(): IUserRepository
  getPostRepository(): IPostRepository
  // ...
}

class PostgreSQLDatabaseFactory implements IDatabaseFactory {
  getUserRepository(): IUserRepository {
    return new PostgreSQLUserRepository(this.prisma)
  }
}

class MongoDBDatabaseFactory implements IDatabaseFactory {
  getUserRepository(): IUserRepository {
    return new MongoDBUserRepository(this.mongoose)
  }
}
```

**Why it helps:** Switch PostgreSQL vs MongoDB without changing consumers of the factory.

---

### 2. FACTORY METHOD

**Intent:** Centralize object creation behind a single place that can vary by environment or config.

**Where:** e.g. `backend/src/infrastructure/services/StorageServiceFactory.ts` (or equivalent storage bootstrap)

```typescript
class StorageServiceFactory {
  static createFromEnvironment(): IFileStorageService {
    const storageType = process.env.STORAGE_TYPE || 'local'

    switch (storageType) {
      case 'cloudinary':
        return new CloudinaryStorageService()
      case 'local':
        return new LocalStorageService()
      default:
        return new LocalStorageService()
    }
  }
}
```

**Why it helps:** One place decides which storage implementation the app uses.

---

### 3. STRATEGY

**Intent:** Encapsulate interchangeable algorithms (here: storage backends) behind a common interface.

**Where:** `backend/src/infrastructure/repositories/`

```typescript
interface IChatRepository {
  createRoom(data: CreateChatRoomData): Promise<ChatRoom>
  findRoomById(id: string): Promise<ChatRoom | null>
}

// Strategy 1: primary database
class DatabaseChatRepository implements IChatRepository { /* ... */ }

// Strategy 2: Redis-oriented implementation
class RedisChatRepository implements IChatRepository { /* ... */ }

// Strategy 3: hybrid (Cache-Aside)
class HybridChatRepository implements IChatRepository {
  async findRoomById(id: string) {
    const cached = await this.redisRepo?.findRoomById(id)
    if (cached) return cached
    return await this.databaseRepo.findRoomById(id)
  }
}
```

**Why it helps:** Swap persistence strategies without rewriting domain logic.

---

### 4. SINGLETON

**Intent:** Ensure a single shared instance (e.g. one Prisma client for the process).

**Where:** `backend/src/infrastructure/database/services/`

```typescript
class PrismaDatabaseService {
  private static instance: PrismaDatabaseService

  static getInstance(): PrismaDatabaseService {
    if (!PrismaDatabaseService.instance) {
      PrismaDatabaseService.instance = new PrismaDatabaseService()
    }
    return PrismaDatabaseService.instance
  }

  private constructor() {
    this.prisma = new PrismaClient()
  }
}
```

**Why it helps:** One DB connection graph per app instance; use sparingly and only where a single instance is correct.

---

### 5. OBSERVER

**Intent:** One-to-many dependency: when one object changes, dependents are notified.

**Where:** `backend/src/infrastructure/services/SocketIOChatEventService.ts` (and related real-time paths)

```typescript
class SocketIOChatEventService implements IChatEventService {
  private io: SocketIOServer

  setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('join_room', (data) => {
        socket.join(`room:${data.roomId}`)
      })
    })
  }

  async emitMessageReceived(roomId: string, message: ChatMessage) {
    this.io.to(`room:${roomId}`).emit('message_received', message)
  }
}
```

**Why it helps:** Real-time delivery to all subscribers in a room.

---

### 6. DECORATOR (as middleware)

**Intent:** Add behaviour to a request/response path without changing the final handler’s core.

**Where:** Express middleware

```typescript
app.get('/api/posts', getPosts)

app.get('/api/posts', authMiddleware.authenticateToken, getPosts)

app.post(
  '/api/posts',
  authMiddleware.authenticateToken,
  validatePostInput,
  createPost
)
```

**Why it helps:** Compose cross-cutting concerns (auth, validation) around route handlers.

---

### 7. FACADE

**Intent:** A simple surface over a complex subsystem.

**Where:** e.g. `backend/src/infrastructure/container/ChatContainer.ts`

```typescript
class ChatContainer {
  getChatService(): IChatService {
    // Hides construction of hybrid repos, event services, etc.
    return this._chatService
  }
}
```

**Why it helps:** Callers depend on a small API while wiring stays in one place.

---

### 8. ADAPTER

**Intent:** Make two incompatible interfaces work together; here, different DB drivers behind one port.

**Where:** Repository implementations (Prisma vs Mongoose)

```typescript
class PostgreSQLUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { username } })
  }
}

class MongoDBUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    return await UserModel.findOne({ username }).exec()
  }
}
```

**Why it helps:** The domain depends on `IUserRepository`, not on Prisma or Mongoose.

---

### 9. CHAIN OF RESPONSIBILITY

**Intent:** Pass a request along a chain until something handles it.

**Where:** Express middleware pipeline

```typescript
app.post(
  '/api/posts',
  corsMiddleware,
  authMiddleware.authenticate,
  validateInput,
  rateLimit,
  createPost
)
```

**Why it helps:** Modular, ordered processing.

---

### 10. TEMPLATE METHOD (shape of use cases)

**Intent:** Fix the *shape* of an algorithm; subclasses or collaborators fill steps.

**Where:** `backend/src/application/use-cases/` (if you introduce an explicit base; illustrative)

```typescript
abstract class BaseUseCase<TInput, TOutput> {
  async execute(input: TInput): Promise<TOutput> {
    this.validate(input)
    const result = await this.doExecute(input)
    this.logResult(result)
    return result
  }

  abstract doExecute(input: TInput): Promise<TOutput>
}
```

**Why it helps:** Consistent flow (validate → work → log) across use cases.

---

### 11. PROXY (lazy wiring)

**Intent:** Stand in for a heavy object; initialize on first use.

**Where:** Some containers defer fully building a service until first access (pattern sketch)

```typescript
class ChatContainer {
  private _chatService!: IChatService
  private _initialized = false

  getChatService(): IChatService {
    if (!this._initialized) {
      this.initializeServices()
      this._initialized = true
    }
    return this._chatService
  }
}
```

**Why it helps:** Avoid work until the feature is actually used (when used carefully).

---

### 12. BUILDER (incremental app setup)

**Intent:** Construct a complex object step by step.

**Where:** Express app bootstrap; Redux `createSlice` is also “builder-like” in API shape

```typescript
function buildApp(): Express.Application {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', createAuthRoutes())
  app.use('/api', createPostRoutes())
  return app
}
```

**Why it helps:** Readable, ordered assembly of the HTTP stack.

---

## Architectural patterns

### 1. Dependency injection (DI)

**Where:** `backend/src/infrastructure/container/`

```typescript
class ChatService {
  constructor(
    private repository: IChatRepository,
    private eventService: IChatEventService
  ) {}
}
```

**Why:** Loose coupling, easier tests (mocks), swappable implementations.

---

### 2. Repository

**Where:** `backend/src/infrastructure/repositories/`

```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  create(user: CreateUserData): Promise<User>
}
```

**Why:** Domain and application do not query SQL/Mongo directly.

---

### 3. Cache-Aside

**Where:** e.g. `backend/src/infrastructure/repositories/hybrid/HybridChatRepository.ts`

1. Read: try cache → on miss, load DB → populate cache.
2. Write: update DB → invalidate or update cache.
3. Delete: delete DB → invalidate cache.

**Why:** Read latency improvement with a clear invalidation story.

---

### 4. Cursor-based pagination

**Where:** e.g. `backend/src/infrastructure/repositories/postgresql/PostgreSQLPostRepository.ts`

```typescript
async findWithCursor(params: CursorPaginationParams): Promise<CursorPaginationResult<Post>> {
  const { cursor, limit = 20, userId } = params
  const posts = await this.prisma.post.findMany({
    where: {
      ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      ...(userId && { userId })
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1
  })
  const hasMore = posts.length > limit
  const data = hasMore ? posts.slice(0, limit) : posts
  return {
    data,
    nextCursor: data[data.length - 1]?.createdAt.toISOString(),
    hasMore
  }
}
```

**vs offset:** stable under concurrent inserts, scalable “next page” without `OFFSET` cost explosion.

---

### 5. Pub/Sub (Redis or similar)

Publisher emits after a write; subscribers fan out to Socket.IO rooms or workers.

**Why:** Decouple producers from delivery mechanics and scale consumers.

---

### 6. Decorator (middleware) — architectural note

Same idea as GoF #6, framed as a chain of nested wrappers around a handler (CORS, auth, rate limit, etc.).

---

### 7. Facade (containers)

Containers expose `getXService()` while hiding many constructors.

---

### 8. Strategy (storage and DB)

`IStorageStrategy` / `IFileStorageService` and repository interfaces allow swapping local vs cloud or SQL vs document stores.

```typescript
interface IStorageStrategy {
  upload(file: Buffer): Promise<string>
}
```

---

## Data structures

### 1. Map (hash map)

**Where:** e.g. Socket.IO user ↔ socket id maps

```typescript
private userSockets = new Map<string, string>()
private socketUsers = new Map<string, string>()
```

**Complexity:** average O(1) get/set.

---

### 2. List (Redis lists)

**Where:** message history in Redis when used

- `LPUSH` / `LRANGE` / `LTRIM` with documented complexity characteristics in Redis.

---

### 3. Set (Redis sets)

**Where:** room membership, unique participants

- `SADD`, `SISMEMBER`, `SMEMBERS` — good for membership tests.

---

### 4. Sorted set (Redis)

**Where:** leaderboards or score-ordered data

- `ZADD`, `ZRANGE` for top-N.

---

### 5. Array (JS)

**Where:** ordered collections in memory and in Redux state; know cost of `unshift`/`splice` vs push.

---

### 6. Tree-like state (Immer + Redux Toolkit)

`createSlice` with Immer gives structural sharing and ergonomic “mutating” reducers that remain immutable in practice.

---

### 7. Plain objects / config maps

**Where:** hybrid repository config (TTL, key builders) — O(1) field access with clear shape.

---

## Algorithms

### 1. Cursor pagination (query shape)

`WHERE createdAt < ? ORDER BY createdAt DESC LIMIT n` (values depend on your schema). Uses the index for efficient range scans.

---

### 2. Redis MULTI/EXEC

Batch related writes so they succeed or fail together (when you need atomicity at the Redis level).

---

### 3. Parallel I/O with `Promise.all`

**Where:** loading several Redis sets or room documents concurrently instead of serial awaits—reduce tail latency when safe.

---

### 4. Index-backed search in DBs

B-tree (PostgreSQL) and Redis sorted-set access patterns both rely on log-time or better structures for ordered access—your `ORDER BY` + range predicates should match an index you actually have.

---

### 5. Memoized selectors (Reselect / RTK)

`createSelector` avoids recomputing derived lists when inputs are unchanged.

---

### 6. Hashing

- Passwords: bcrypt (cost factor explicit).  
- JWT: HMAC or asymmetric signatures depending on configuration.

---

### 7. Graceful degradation

Try Redis, fall back to primary DB, log and surface partial failure policies explicitly—**do not** silently mask errors that should fail the request.

---

### 8. “Circuit breaker” (lightweight)

If optional cache write fails, log and still return success for the main path *when that is a documented product decision*—distinguish this from true circuit breaking across services (libraries exist for the latter).

---

### 9. Rate limiting (token bucket / fixed window)

**Where:** e.g. `express-rate-limit` on hot routes like login.

---

### 10. Sorting

Prefer DB `ORDER BY` for large sets; in-memory `sort` only for small, already-fetched arrays.

```typescript
posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
```

---

## Frontend patterns

### 1. Container / presentational

**Where:** FSD or feature folders—dumb `PostCard`, smart `PostList` that dispatches and selects.

### 2. Custom hooks

Encapsulate `useEffect` + Redux/React Query in `usePosts()`-style hooks for reuse and testing.

### 3. Compound components

shadcn/Radix `Dialog` with `DialogTrigger`, `DialogContent`, `DialogHeader`, etc.

### 4. Children and render props

Composition via `children` and optional render props for flexible UI.

### 5. State machines (async in slices)

`loading: 'idle' | 'pending' | 'fulfilled' | 'rejected'` (or `createAsyncThunk` lifecycle) models async flows clearly.

### 6. Optimistic updates

Update UI on pending, reconcile on fulfill/reject—great UX when conflicts are rare or handled.

---

## Summary


| Category             | Count (approximate) |
| -------------------- | ------------------- |
| GoF patterns (above) | 12                  |
| Architectural        | 8                   |
| Data structures      | 7                   |
| Algorithms           | 10                  |
| Frontend patterns    | 6                   |


**Total:** on the order of **40+** named patterns and techniques, many overlapping in spirit (e.g. decorator vs Express middleware). Use this document to navigate the codebase, then verify paths and class names in source—the implementation is the source of truth.

The project aims at **clear boundaries** (Clean Architecture on the server, structured UI on the client), **testability** (ports, DI, MSW on the client), and **operational clarity** (logging, rate limits, optional Redis, OpenAPI for HTTP).