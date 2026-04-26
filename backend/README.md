# Backend API - File Upload & Authentication

A Node.js backend API built with Clean Architecture principles, supporting user authentication, file uploads, avatar management, and post creation with multi-database support (PostgreSQL/MongoDB).

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

- **Domain Layer**: Entities, repositories interfaces, and business logic
- **Application Layer**: Use cases, services, and DTOs
- **Infrastructure Layer**: Database implementations, external services
- **Presentation Layer**: Controllers, routes, and middleware

## 🚀 Features

- **User Authentication**: JWT-based auth with refresh tokens
- **File Upload**: Support for local storage and Cloudinary
- **Avatar Management**: User profile pictures with upload/delete
- **Post Management**: Create, read, update, delete posts with cursor pagination
- **Multi-Database Support**: PostgreSQL (default) and MongoDB
- **Clean Architecture**: Maintainable and testable codebase
- **TypeScript**: Full type safety throughout the application

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher) - *recommended*
- **MongoDB** (v5 or higher) - *optional*
- **npm** or **yarn**

## 🗄️ Database Setup

### PostgreSQL Setup (Recommended)

1. **Install PostgreSQL**:
   ```bash
   # Windows (using Chocolatey)
   choco install postgresql
   
   # macOS (using Homebrew)
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Start PostgreSQL service**:
   ```bash
   # Windows
   net start postgresql-x64-13
   
   # macOS
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo systemctl start postgresql
   ```

3. **Create database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE fs_project;
   
   # Create user (optional)
   CREATE USER fs_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE fs_project TO fs_user;
   
   # Exit
   \q
   ```

4. **Configure environment**:
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your PostgreSQL credentials
   DATABASE_TYPE=postgresql
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=fs_project
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   ```

### MongoDB Setup (Alternative)

1. **Install MongoDB**:
   ```bash
   # Windows (using Chocolatey)
   choco install mongodb
   
   # macOS (using Homebrew)
   brew install mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   ```

2. **Start MongoDB service**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl start mongod
   ```

3. **Configure environment**:
   ```bash
   # Edit .env with MongoDB settings
   DATABASE_TYPE=mongodb
   MONGODB_URI=mongodb://localhost:27017/fs_project
   ```

## 🛠️ Installation & Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd backend
npm install
   ```

2. **Database setup**:
   
   **For PostgreSQL**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database (creates tables)
   npx prisma db push
   
   # Optional: View database in Prisma Studio
   npx prisma studio
   ```
   
   **For MongoDB**:
   ```bash
   # No migrations needed for MongoDB
   # Collections are created automatically
   ```

3. **Environment configuration**:
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   
   # Set your database credentials and secrets
   nano .env
   ```

## 🚀 Running the Application

### Development Mode
```bash
# Start the development server
npm run dev

# The server will start on http://localhost:3100
```

### Production Mode
```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📊 Database Management

### PostgreSQL Commands
```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Push schema changes to database
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (⚠️ DANGER: deletes all data)
npm run db:reset
```

### Database Schema
The application uses Prisma for schema management. Key models:

- **User**: Authentication and profile data
- **Post**: User-generated content with cursor pagination
- **File**: Uploaded files and metadata
- **RefreshToken**: JWT refresh token management

## 🌱 Seeding (PostgreSQL + MongoDB)

A unified seeder populates both databases with realistic, deterministic data.

### Prerequisites

1. Postgres schema is up-to-date (`npm run db:migrate` for dev, `npm run db:migrate:deploy` for prod-like envs).
2. `POSTGRESQL_URL` and `MONGODB_URI` are set in `.env`.
3. MongoDB is reachable — the seeder uses a standalone-compatible `bulkWrite` strategy (no replica-set requirement).

### Run

```bash
npm run db:seed
```

By default this runs the full pipeline (`SEED_TARGET=all`): Postgres first, MongoDB second.

You can also run engines independently:

```bash
# Postgres only
npm run db:seed -- --target=postgres

# MongoDB only
npm run db:seed -- --target=mongo

# Both (explicit)
npm run db:seed -- --target=all
```

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SEED_RANDOM` | `false` | `true` disables determinism (faker produces random output). Default runs are reproducible. |
| `SEED_SEED` | `12345` | Numeric seed used by faker + deterministic id derivation. |
| `SEED_USERS` | `10` | Number of users to create. |
| `SEED_POSTS_PER_USER` | `3` | Posts per user (seeded in PG and mirrored in Mongo). |
| `SEED_FILES_PER_USER` | `1` | Files per user (first becomes user avatar). |
| `SEED_CHAT_ROOMS` | `3` | Chat rooms to create (each contains every user as member). |
| `SEED_MESSAGES_PER_ROOM` | `15` | Messages per chat room. |
| `SEED_DEFAULT_PASSWORD` | `Password123!` | Plain password for all seeded users (hashed with bcrypt). |
| `SEED_ID_NAMESPACE` | `6f9619ff-8b86-d011-b42d-00c04fc964ff` | UUIDv5 namespace for deterministic id derivation. Must be a valid UUID. |
| `SEED_CONTINUE_ON_ERROR` | `false` | `true` aggregates per-module errors instead of failing fast. |
| `SEED_TARGET` | `all` | Which engine(s) to seed: `all`, `postgres`, or `mongo`. |
| `ALLOW_PROD_SEED` | `false` | Required to be `true` when `NODE_ENV=production`. Otherwise the seeder refuses to run. |

### Idempotency

Every entity id (Postgres primary key, Mongo `id` / `_id`) is deterministically derived
from a stable "external key" via UUIDv5. Re-running the seeder with the same
`SEED_SEED` + `SEED_ID_NAMESPACE` updates existing rows instead of duplicating
them (`upsert` in Postgres, `bulkWrite({ ordered: false })` with `upsert: true`
in MongoDB).

MongoDB seeding is independent from Postgres seeding: Mongo modules generate
their own deterministic identities and can run without Postgres connectivity.

### Failure troubleshooting

The seeder prints structured, actionable errors. Common cases:

- **`Prisma cannot reach Postgres` / `P1001`** — start Postgres (e.g. `docker compose -f docker-compose.dev.yml up -d`) and check `POSTGRESQL_URL`.
- **`does not exist in the current database` / `P2021`** — schema is missing; run `npm run db:migrate`.
- **`MongoServerSelectionError` / `Authentication failed`** — verify `MONGODB_URI`, network (VPN, IP allowlist for Atlas), and credentials.
- **`Unique constraint violated` / `P2002`** — usually means a previous run was executed with `SEED_RANDOM=true` and stored non-deterministic usernames/emails. Reset affected tables or re-run with the same randomness mode.
- **`Refusing to seed in production`** — intended. Re-run with `ALLOW_PROD_SEED=true` only if you truly want to seed a production database.

### Architecture

```
src/infrastructure/database/seeders/
├── index.ts                     # CLI entry: env, connections, exit codes
├── seed.orchestrator.ts         # Ordered pipeline runner
├── seed.config.ts               # Env → typed SeedConfig
├── seed.types.ts                # SeedModule / SeedContext contracts
├── identity/identity-map.ts     # Cross-DB id derivation (UUIDv5 + ObjectId)
├── factories/                   # Faker-driven data generators (pure)
├── modules/
│   ├── postgres/                # users → files → posts → chat (each in its own $transaction)
│   └── mongodb/                 # posts, chat (bulkWrite upserts)
└── utils/
    ├── env.guard.ts             # Production guard (ALLOW_PROD_SEED)
    └── seed.logger.ts           # Structured progress + actionable errors
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile

### Users
- `POST /api/users/:id/avatar` - Upload user avatar
- `GET /api/users/:id/avatar` - Get user avatar
- `DELETE /api/users/:id/avatar` - Delete user avatar

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get posts with cursor pagination
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Files
- `POST /api/upload` - Upload file
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run legacy tests
npm run test:legacy
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── domain/                 # Domain layer (entities, interfaces)
│   │   ├── entities/          # Business entities
│   │   ├── repositories/      # Repository interfaces
│   │   ├── services/          # Service interfaces (IDatabaseService)
│   │   ├── errors/            # Domain error classes
│   │   └── config/            # Domain configuration
│   ├── application/           # Application layer (use cases, services)
│   │   ├── use-cases/         # Business use cases
│   │   ├── services/          # Application services (UserService, etc.)
│   │   └── dtos/              # Data transfer objects
│   ├── infrastructure/        # Infrastructure layer (implementations)
│   │   ├── database/          # Database implementations
│   │   │   ├── factories/     # Database factory implementations
│   │   │   ├── services/      # Database service implementations
│   │   │   │   ├── prisma/    # Prisma-specific service (PostgreSQL)
│   │   │   │   ├── mongoose/  # Mongoose-specific service (MongoDB)
│   │   │   │   └── validation.ts  # Shared validation utilities
│   │   │   └── schemas/       # Database schemas (MongoDB, etc.)
│   │   ├── repositories/      # Repository implementations
│   │   │   ├── postgresql/    # PostgreSQL repositories
│   │   │   └── mongodb/       # MongoDB repositories
│   │   └── container/         # Dependency injection containers
│   └── presentation/          # Presentation layer (API)
│       ├── controllers/       # HTTP controllers
│       ├── routes/            # Express routes
│       ├── middleware/        # Express middleware
│       └── utils/             # Presentation utilities
├── prisma/                    # Prisma schema and migrations
├── scripts/                   # Utility scripts
└── test/                      # Test files
```

## 🔒 Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fs_project
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key

# Server Configuration
PORT=3100
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check if PostgreSQL/MongoDB is running
   - Verify connection credentials in `.env`
   - Ensure database exists

2. **Prisma Client Not Generated**:
   ```bash
   npx prisma generate
   ```

3. **Schema Out of Sync**:
   ```bash
   npx prisma db push
   ```

4. **Port Already in Use**:
   - Change `PORT` in `.env` file
   - Or kill the process using the port

### Database Switching

To switch between PostgreSQL and MongoDB:

1. Update `DATABASE_TYPE` in `.env`
2. Restart the application
3. For PostgreSQL: run `npx prisma db push`
4. For MongoDB: no additional setup needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all prerequisites are installed
4. Verify environment configuration

For additional help, please open an issue in the repository.