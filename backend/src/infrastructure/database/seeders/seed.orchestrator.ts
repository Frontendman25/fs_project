import { faker, type Faker } from '@faker-js/faker'
import mongoose from 'mongoose'
import { PrismaClient } from '@prisma/client'

import type { ILoggerService } from '@/domain/services/logger.service'

import { IdentityMap } from './identity/identity-map'
import { postgresUsersSeed } from './modules/postgres/users.seed'
import { postgresFilesSeed } from './modules/postgres/files.seed'
import { postgresPostsSeed } from './modules/postgres/posts.seed'
import { postgresChatSeed } from './modules/postgres/chat.seed'
import { mongodbUsersSeed } from './modules/mongodb/users.seed'
import { mongodbFilesSeed } from './modules/mongodb/files.seed'
import { mongodbPostsSeed } from './modules/mongodb/posts.seed'
import { mongodbChatSeed } from './modules/mongodb/chat.seed'
import type {
  SeedConfig,
  SeedContext,
  SeedModule,
  SeedModuleResult
} from './seed.types'
import { SeedProgressReporter, describeError } from './utils/seed.logger'

/**
 * Orchestrates the full seeding pipeline.
 *
 * Order is fixed and intentional when target=all:
 *   1. Postgres users/files/posts/chat
 *   2. MongoDB posts/chat
 *
 * Mongo modules can also run independently (target=mongo) because identities
 * are deterministic and not tied to Postgres-generated rows.
 */
export class SeedOrchestrator {
  private readonly postgresModules: readonly SeedModule[] = [
    postgresUsersSeed,
    postgresFilesSeed,
    postgresPostsSeed,
    postgresChatSeed
  ]

  private readonly mongoModules: readonly SeedModule[] = [
    mongodbUsersSeed,
    mongodbFilesSeed,
    mongodbPostsSeed,
    mongodbChatSeed
  ]

  constructor(
    private readonly config: SeedConfig,
    private readonly prisma: PrismaClient,
    private readonly mongoConnection: typeof mongoose,
    private readonly logger: ILoggerService
  ) {}

  async run(): Promise<readonly SeedModuleResult[]> {
    const reporter = new SeedProgressReporter(this.logger)
    const ctx = this.buildContext()
    const results: SeedModuleResult[] = []
    const modules = this.resolveModules()

    this.logger.info(
      {
        target: this.config.target,
        deterministic: !this.config.random,
        seed: this.config.seed,
        counts: this.config.counts
      },
      'starting seed pipeline'
    )

    for (const mod of modules) {
      reporter.stepStart(mod.name, mod.engine)
      try {
        const res = await mod.run(ctx)
        results.push(res)
        reporter.stepEnd(res)
      } catch (error) {
        reporter.stepFailure(mod.name, mod.engine, error)
        if (!this.config.continueOnError) {
          const { message, hint } = describeError(error)
          throw new SeedPipelineError(
            mod.name,
            mod.engine,
            message,
            hint,
            error
          )
        }
      }
    }

    reporter.summary(results)
    return results
  }

  private buildContext(): SeedContext {
    const scoped = this.seedFaker(faker)
    const identity = new IdentityMap(this.config.idNamespace)

    return {
      config: this.config,
      prisma: this.prisma,
      mongoose: this.mongoConnection,
      faker: scoped,
      logger: this.logger,
      identity
    }
  }

  private resolveModules(): readonly SeedModule[] {
    switch (this.config.target) {
      case 'postgres':
        return this.postgresModules
      case 'mongo':
        return this.mongoModules
      default:
        return [...this.postgresModules, ...this.mongoModules]
    }
  }

  private seedFaker(f: Faker): Faker {
    if (!this.config.random) {
      f.seed(this.config.seed)
    }
    return f
  }
}

export class SeedPipelineError extends Error {
  readonly step: string
  readonly engine: string
  readonly hint?: string
  readonly cause?: unknown

  constructor(
    step: string,
    engine: string,
    message: string,
    hint: string | undefined,
    cause: unknown
  ) {
    super(`[seed:${engine}:${step}] ${message}${hint ? ` — ${hint}` : ''}`)
    this.name = 'SeedPipelineError'
    this.step = step
    this.engine = engine
    this.hint = hint
    this.cause = cause
  }
}
