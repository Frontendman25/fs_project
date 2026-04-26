import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanDatabase } from '../../helpers/mongoose.clean-database'

type MockColl = { deleteMany: ReturnType<typeof vi.fn> }

function mockMongoose(opts: {
  readyState: number
  collections: Record<string, MockColl>
  asPromise?: ReturnType<typeof vi.fn>
}) {
  const conn = {
    readyState: opts.readyState,
    collections: opts.collections,
    asPromise:
      opts.asPromise ??
      vi.fn().mockImplementation(async () => {
        conn.readyState = 1
      })
  }
  return { connection: conn } as unknown as import('mongoose').Mongoose
}

describe('cleanDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deleteMany on every collection in parallel when connected', async () => {
    const a = { deleteMany: vi.fn().mockResolvedValue({}) }
    const b = { deleteMany: vi.fn().mockResolvedValue({}) }
    const mongoose = mockMongoose({
      readyState: 1,
      collections: { users: a, posts: b }
    })

    await cleanDatabase(mongoose)

    expect(a.deleteMany).toHaveBeenCalledWith({})
    expect(b.deleteMany).toHaveBeenCalledWith({})
  })

  it('skips names listed in skipCollections', async () => {
    const keep = { deleteMany: vi.fn().mockResolvedValue({}) }
    const mongoose = mockMongoose({
      readyState: 1,
      collections: { protected_logs: keep, users: { deleteMany: vi.fn().mockResolvedValue({}) } }
    })

    await cleanDatabase(mongoose, {
      skipCollections: ['protected_logs']
    })

    expect(keep.deleteMany).not.toHaveBeenCalled()
  })

  it('awaits asPromise when state is connecting', async () => {
    const users = { deleteMany: vi.fn().mockResolvedValue({}) }
    const conn: {
      readyState: number
      collections: Record<string, MockColl>
      asPromise: ReturnType<typeof vi.fn>
    } = {
      readyState: 2,
      collections: { users },
      asPromise: vi.fn()
    }
    conn.asPromise = vi.fn().mockImplementation(async () => {
      conn.readyState = 1
    })
    const mongoose = { connection: conn } as unknown as import('mongoose').Mongoose

    await cleanDatabase(mongoose)

    expect(conn.asPromise).toHaveBeenCalledTimes(1)
    expect(users.deleteMany).toHaveBeenCalled()
  })

  it('throws when disconnected', async () => {
    const mongoose = mockMongoose({ readyState: 0, collections: {} })

    await expect(cleanDatabase(mongoose)).rejects.toThrow(/readyState=0/)
  })

  it('ignores NamespaceNotFound (code 26)', async () => {
    const err = Object.assign(new Error('ns not found'), { code: 26 })
    const ghost = { deleteMany: vi.fn().mockRejectedValue(err) }
    const ok = { deleteMany: vi.fn().mockResolvedValue({}) }
    const mongoose = mockMongoose({
      readyState: 1,
      collections: { ghost, ok }
    })

    await expect(cleanDatabase(mongoose)).resolves.toBeUndefined()
    expect(ok.deleteMany).toHaveBeenCalled()
  })

  it('rethrows non-namespace errors', async () => {
    const bad = { deleteMany: vi.fn().mockRejectedValue(new Error('fatal')) }
    const mongoose = mockMongoose({ readyState: 1, collections: { bad } })

    await expect(cleanDatabase(mongoose)).rejects.toThrow('fatal')
  })
})
