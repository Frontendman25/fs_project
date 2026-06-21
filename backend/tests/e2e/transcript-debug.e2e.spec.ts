import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll
} from 'vitest'
import request from 'supertest'

import { setupApplication } from '@/bootstrap/setupApplication'
import type { ApplicationBundle } from '@/bootstrap/setupApplication'

vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn()
  }
}))

import { YoutubeTranscript } from 'youtube-transcript'

const dbConfigured = Boolean(
  process.env.POSTGRESQL_URL &&
  process.env.JWT_SECRET &&
  process.env.REFRESH_TOKEN_SECRET
)

describe.skipIf(!dbConfigured)('E2E: transcript debug probe', () => {
  let bundle: ApplicationBundle
  const token = 'test-debug-transcript-token'

  beforeEach(async () => {
    process.env.DEBUG_TRANSCRIPT_TOKEN = token
    vi.mocked(YoutubeTranscript.fetchTranscript).mockResolvedValue([
      { text: 'Hello from captions. '.repeat(20), duration: 1, offset: 0 }
    ])
  })

  beforeAll(async () => {
    bundle = await setupApplication({ listen: false })
  })

  afterAll(async () => {
    await bundle.shutdown()
  })

  it('POST /api/debug/transcript rejects missing token', async () => {
    const res = await request(bundle.app)
      .post('/api/debug/transcript')
      .send({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/debug/transcript returns source when token valid', async () => {
    const res = await request(bundle.app)
      .post('/api/debug/transcript')
      .set('x-debug-token', token)
      .send({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.source).toBe('youtube-transcript')
    expect(res.body.data.attempts[0]?.ok).toBe(true)
  })
})
