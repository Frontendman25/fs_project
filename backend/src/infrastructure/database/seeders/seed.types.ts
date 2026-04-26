import type { PrismaClient } from '@prisma/client'
import type mongoose from 'mongoose'
import type { Faker } from '@faker-js/faker'

import type { ILoggerService } from '@/domain/services/logger.service'

import type { IdentityMap } from './identity/identity-map'

/**
 * Seed module contract.
 *
 * Each module is scoped to a single database engine (so transaction semantics
 * are predictable) and is responsible for one logical concern (users, posts,
 * chat, ...). The orchestrator decides execution order; modules must not
 * reach across the engine boundary by themselves — cross-db linkage happens
 * through the shared `IdentityMap`.
 */
export interface SeedModule {
  readonly name: string
  readonly engine: 'postgres' | 'mongodb'
  run(ctx: SeedContext): Promise<SeedModuleResult>
}

export interface SeedModuleResult {
  readonly name: string
  readonly engine: 'postgres' | 'mongodb'
  readonly created: number
  readonly updated: number
  readonly skipped: number
  readonly durationMs: number
}

export interface SeedConfig {
  /** Fixed seed used by faker + deterministic id derivation. */
  readonly seed: number
  /** When true, faker produces random output (non-reproducible). */
  readonly random: boolean
  /** Counts control the volume of generated data. */
  readonly counts: SeedCounts
  /** UUID v5 namespace used to derive stable ids from external keys. */
  readonly idNamespace: string
  /** Default password used for all seeded users (hashed before write). */
  readonly defaultPassword: string
  /** Whether to continue on non-fatal errors and aggregate them. */
  readonly continueOnError: boolean
  /** Which engine(s) to seed: postgres, mongo, or both. */
  readonly target: SeedTarget
}

export interface SeedCounts {
  readonly users: number
  readonly filesPerUser: number
  readonly postsPerUser: number
  readonly chatRooms: number
  readonly messagesPerRoom: number
}

export interface SeedContext {
  readonly config: SeedConfig
  readonly prisma: PrismaClient
  readonly mongoose: typeof mongoose
  readonly faker: Faker
  readonly logger: ILoggerService
  readonly identity: IdentityMap
}

export type SeedTarget = 'all' | 'postgres' | 'mongo'
