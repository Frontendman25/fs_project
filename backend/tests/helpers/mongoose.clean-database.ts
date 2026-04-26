import type { Connection, Mongoose } from 'mongoose'

export type CleanDatabaseOptions = {
  /** Defaults to `mongoose.connection`. */
  connection?: Connection
  /** Collection names to skip (logical names as in `connection.collections`). */
  skipCollections?: Set<string> | readonly string[]
}

function isNamespaceNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false
  }
  const o = err as { code?: number; codeName?: string; message?: string }
  if (o.code === 26) {
    return true
  }
  if (o.codeName === 'NamespaceNotFound') {
    return true
  }
  if (typeof o.message === 'string' && /ns not found/i.test(o.message)) {
    return true
  }
  return false
}

async function ensureWritableConnection(conn: Connection): Promise<void> {
  if (conn.readyState === 1) {
    return
  }
  if (conn.readyState === 2) {
    await conn.asPromise()
  }
  if (conn.readyState !== 1) {
    throw new Error(
      `cleanDatabase requires an open Mongoose connection (readyState=${conn.readyState}, expected 1). ` +
        'Call mongoose.connect() and await it before beforeEach, or pass a connected `connection` option.'
    )
  }
}

/**
 * Wipes all registered collections on the connection via parallel `deleteMany({})`.
 * Discovery uses `connection.collections` so new models require no helper changes.
 */
export async function cleanDatabase(
  mongoose: Mongoose,
  options?: CleanDatabaseOptions
): Promise<void> {
  const conn = options?.connection ?? mongoose.connection
  await ensureWritableConnection(conn)

  const skip = new Set(
    options?.skipCollections ? [...options.skipCollections] : []
  )

  const tasks = Object.entries(conn.collections).map(
    async ([name, collection]) => {
      if (skip.has(name)) {
        return
      }
      try {
        await collection.deleteMany({})
      } catch (err) {
        if (isNamespaceNotFound(err)) {
          return
        }
        throw err
      }
    }
  )

  await Promise.all(tasks)
}
