import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { toPublicFileUrl } from '@/presentation/mappers/file-public-url.mapper'

describe('toPublicFileUrl', () => {
  const envSnapshot = { ...process.env }

  beforeEach(() => {
    process.env.BACKEND_URL = 'http://localhost:3100'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = { ...envSnapshot }
  })

  it('returns /api/files/:id for local disk path', () => {
    const url = toPublicFileUrl({
      id: 'file-1',
      path: '/app/uploads/file-1.jpg',
      storageType: 'local'
    })
    expect(url).toBe('http://localhost:3100/api/files/file-1')
  })

  it('ignores legacy http /files/:id stored in path for local storage', () => {
    const url = toPublicFileUrl({
      id: 'cmpe0b3n40006pn54bgc4m7pb',
      path: 'http://localhost:3100/files/cmpe0b3n40006pn54bgc4m7pb',
      storageType: 'local'
    })
    expect(url).toBe(
      'http://localhost:3100/api/files/cmpe0b3n40006pn54bgc4m7pb'
    )
  })

  it('returns cloudinary secure_url as-is', () => {
    const cdn = 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg'
    const url = toPublicFileUrl({
      id: 'file-cdn',
      path: cdn,
      storageType: 'cloudinary'
    })
    expect(url).toBe(cdn)
  })
})
