import type { SeedConfig } from './seed.types'

const DEFAULT_NAMESPACE = '6f9619ff-8b86-d011-b42d-00c04fc964ff'

/**
 * Build seed configuration from environment variables.
 *
 * Environment knobs
 * -----------------
 * - SEED_RANDOM=true        → disable deterministic mode (random faker output)
 * - SEED_SEED=<number>      → override the default faker seed (12345)
 * - SEED_USERS, SEED_POSTS_PER_USER, SEED_FILES_PER_USER,
 *   SEED_CHAT_ROOMS, SEED_MESSAGES_PER_ROOM  → volume controls
 * - SEED_DEFAULT_PASSWORD   → plaintext password for all seeded users
 * - SEED_ID_NAMESPACE       → UUIDv5 namespace (must be a valid UUID)
 * - SEED_CONTINUE_ON_ERROR  → aggregate per-module errors instead of failing fast
 * - SEED_TARGET             → all | postgres | mongo
 */
export function loadSeedConfig(): SeedConfig {
  const random = parseBoolean(process.env.SEED_RANDOM, false)
  const target = parseTarget(process.env.SEED_TARGET)

  return {
    seed: parseNumber(process.env.SEED_SEED, 12_345),
    random,
    counts: {
      users: parseNumber(process.env.SEED_USERS, 10),
      filesPerUser: parseNumber(process.env.SEED_FILES_PER_USER, 1),
      postsPerUser: parseNumber(process.env.SEED_POSTS_PER_USER, 3),
      chatRooms: parseNumber(process.env.SEED_CHAT_ROOMS, 3),
      messagesPerRoom: parseNumber(process.env.SEED_MESSAGES_PER_ROOM, 15)
    },
    idNamespace: process.env.SEED_ID_NAMESPACE ?? DEFAULT_NAMESPACE,
    defaultPassword: process.env.SEED_DEFAULT_PASSWORD ?? 'Password123!',
    continueOnError: parseBoolean(process.env.SEED_CONTINUE_ON_ERROR, false),
    target
  }
}

function parseNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `Invalid numeric seed env value: "${raw}". Expected a non-negative number.`
    )
  }
  return Math.floor(parsed)
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null) return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function parseTarget(raw: string | undefined): SeedConfig['target'] {
  if (!raw) return 'all'
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'all' || normalized === 'postgres') return normalized
  if (normalized === 'mongo' || normalized === 'mongodb') return 'mongo'
  throw new Error(
    `Invalid SEED_TARGET value "${raw}". Expected one of: all, postgres, mongo.`
  )
}
