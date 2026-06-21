import { describe, it, expect } from 'vitest'

import {
  extractVideoId,
  prepareTranscriptPayload
} from '@/infrastructure/transcript/youtube-utils'

describe('transcript youtube-utils', () => {
  it('extractVideoId parses watch URLs', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    )
  })

  it('extractVideoId parses youtu.be links', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('prepareTranscriptPayload normalizes and previews text', () => {
    const longText = `${'word '.repeat(200)}. Final sentence.`
    const result = prepareTranscriptPayload(longText, 'abc12345678')

    expect(result.videoId).toBe('abc12345678')
    expect(result.textLength).toBeGreaterThan(80)
    expect(result.preview.length).toBeGreaterThan(0)
  })
})
