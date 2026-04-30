/**
 * Application bootstrap — wires Express, Socket.IO, DB, and routes without
 * requiring HTTP listen. Used by `index.ts` (production) and by integration/e2e tests.
 */
import { createServer } from 'http'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'

import { IDatabaseFactory } from '@/domain/repositories/database.factory'

import { createAuthRoutes } from '@/presentation/routes/auth.routes'
import { createFileRoutes } from '@/presentation/routes/file.routes'
import { createUserRoutes } from '@/presentation/routes/user.routes'
import { createPostRoutes } from '@/presentation/routes/post.routes'
import { createChatRoutes } from '@/presentation/routes/chat.routes'
import { ErrorHandler } from '@/presentation/middleware/error-handler.middleware'
import { AuthMiddleware } from '@/presentation/middleware/auth.middleware'

import { PostgreSQLDatabaseFactory } from '@/infrastructure/database/factories/postgresql-database.factory'
import { FileContainer } from '@/infrastructure/container/file.container'
import { UserContainer } from '@/infrastructure/container/user.container'
import { PostContainer } from '@/infrastructure/container/post.container'
import { ChatContainer } from '@/infrastructure/container/chat.container'
import { logger, startupExitLogger } from '@/infrastructure/utils/logger'
import { RepositoryConfigValidator } from '@/infrastructure/repositories/repository-config.validator'
import { PrismaDatabaseService } from '@/infrastructure/database/services/prisma/prisma-database.service'

import { registerOpenApiDocs } from '@/presentation/openapi/registerSwagger'

export interface ApplicationBundle {
  app: express.Application
  server: ReturnType<typeof createServer>
  io: SocketIOServer
  databaseFactory: IDatabaseFactory
  port: number
  shutdown: () => Promise<void>
}

async function createDatabaseFactory(): Promise<IDatabaseFactory> {
  const dbType = process.env.DATABASE_TYPE || 'postgresql'
  switch (dbType.toLowerCase()) {
    case 'postgresql':
      return new PostgreSQLDatabaseFactory()
    case 'mongodb': {
      const { MongoDBDatabaseFactory } =
        await import('../infrastructure/database/factories/mongodb-database.factory.js')
      return new MongoDBDatabaseFactory()
    }
    default:
      return new PostgreSQLDatabaseFactory()
  }
}

export interface SetupApplicationOptions {
  /** When false, Supertest can bind without opening a TCP port */
  listen: boolean
}

/**
 * Full application wiring (DB, DI containers, routes, error handlers).
 * Safe to call from tests with `listen: false`.
 */
export async function setupApplication(
  options: SetupApplicationOptions
): Promise<ApplicationBundle> {
  if (process.env.NODE_ENV === 'test') {
    await PrismaDatabaseService.resetInstance()
  }

  const envValidation = RepositoryConfigValidator.validateEnvironment()
  if (!envValidation.isValid) {
    for (const message of envValidation.errors) {
      startupExitLogger.fatal({ validationError: message }, message)
    }
    process.exit(1)
  }

  if (process.env.NODE_ENV !== 'test') {
    for (const warning of envValidation.warnings) {
      logger.warn({ warning }, warning)
    }
    logger.info(
      { summary: RepositoryConfigValidator.getConfigSummary() },
      'Environment configuration summary'
    )
  }

  const app = express()
  const server = createServer(app)
  const PORT = Number(process.env.PORT) || 3100

  if (process.env.NODE_ENV !== 'test') {
    try {
      registerOpenApiDocs(app)
    } catch (error) {
      logger.warn({ err: error }, 'Failed to register OpenAPI / Swagger')
    }
  }

  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  app.use(express.json({ limit: '10mb' }))
  app.use(cookieParser())
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )

  const sessionSecret =
    process.env.SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === 'test' ? 'test-session-secret' : '')

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      }
    })
  )

  const databaseFactory = await createDatabaseFactory()
  await databaseFactory.connect()

  const fileContainer = new FileContainer(databaseFactory)
  const userContainer = new UserContainer(databaseFactory, fileContainer)
  const postContainer = new PostContainer(databaseFactory)
  const chatContainer = new ChatContainer(io, databaseFactory, logger)

  const jwtSecret = process.env.JWT_SECRET as string
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string

  const authMiddleware = new AuthMiddleware(
    databaseFactory,
    jwtSecret,
    refreshTokenSecret
  )

  const authRoutes = createAuthRoutes(
    databaseFactory,
    userContainer.getGetUserWithAvatarUseCase(),
    jwtSecret,
    refreshTokenSecret
  )
  const fileRoutes = createFileRoutes(fileContainer.getFileController())
  const userRoutes = createUserRoutes(userContainer.getUserController())
  const postRoutes = createPostRoutes(
    postContainer.getPostController(),
    authMiddleware
  )
  const chatRoutes = createChatRoutes(
    chatContainer.getChatController(),
    authMiddleware
  )

  app.use('/auth', authRoutes)
  app.use('/api', fileRoutes)
  app.use('/api', userRoutes)
  app.use('/api', postRoutes)
  app.use('/api/chat', chatRoutes)

  app.get('/health', async (req, res) => {
    try {
      const isDbHealthy = await databaseFactory.isHealthy()
      const dbStats = isDbHealthy
        ? await databaseFactory.getDatabaseStats()
        : null

      res.status(isDbHealthy ? 200 : 503).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: {
          type: databaseFactory.getDatabaseType(),
          healthy: isDbHealthy,
          stats: dbStats
        },
        environment: process.env.NODE_ENV || 'development'
      })
    } catch (error) {
      console.error('Health check error:', error)
      res.status(503).json({
        success: false,
        message: 'Server health check failed',
        timestamp: new Date().toISOString()
      })
    }
  })

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'File Upload & Auth API Server',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        files: '/api/files',
        upload: '/api/upload',
        users: '/api/users',
        posts: '/api/posts',
        chat: '/api/chat',
        health: '/health'
      },
      features: []
    })
  })

  if (process.env.NODE_ENV === 'development') {
    app.get('/debug/users', async (req, res) => {
      try {
        const userRepo = databaseFactory.getUserRepository()
        const users = await userRepo.findAll()
        res.json({
          success: true,
          count: users.length,
          users: users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email
          }))
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  }

  app.use(ErrorHandler.handle)
  app.use(ErrorHandler.handleNotFound)

  const shutdown = async (): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      })
    } catch {
      // ignore if server was never listening
    }
    await databaseFactory.disconnect()
    await fileContainer.cleanup()
    userContainer.cleanup()
    postContainer.cleanup()
    await chatContainer.cleanup()
    await PrismaDatabaseService.resetInstance()
  }

  if (options.listen) {
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => {
        if (process.env.NODE_ENV !== 'test') {
          logger.info(`Server listening on http://localhost:${PORT}`)
        }
        resolve()
      })
    })
  }

  return {
    app,
    server,
    io,
    databaseFactory,
    port: PORT,
    shutdown
  }
}
