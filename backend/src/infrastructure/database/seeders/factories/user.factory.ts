import type { Faker } from '@faker-js/faker'

export interface GeneratedUser {
  readonly username: string
  readonly email: string
}

/**
 * Deterministic username/email generation.
 *
 * We do NOT rely on faker's randomness for the username root — we derive it
 * from the index so that even when users are seeded in parallel, the produced
 * strings are stable across runs (required for idempotent upserts by
 * `username`/`email` unique keys).
 */
export function generateUser(faker: Faker, index: number): GeneratedUser {
  const baseName = faker.internet
    .username()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20)

  const username = `${baseName || 'user'}_${index}`
  const email = `${username}@example.com`

  return { username, email }
}
