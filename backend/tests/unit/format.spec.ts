import { describe, it, expect } from 'vitest'

import { formatBytes } from '@/utils/format'

describe('formatBytes', () => {
  it('formats bytes to human readable strings', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
  })
})
