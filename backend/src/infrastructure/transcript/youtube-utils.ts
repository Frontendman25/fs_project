export const MAX_TRANSCRIPT_CHARS = 12_000
export const PREVIEW_CHARS = 280
export const MIN_TRANSCRIPT_CHARS = 80

export interface TranscriptAttemptInfo {
  source: string
  ok: boolean
  durationMs: number
  error?: string
}

export class TranscriptProbeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_URL'
      | 'NO_TRANSCRIPT'
      | 'CAPTIONS_DISABLED'
      | 'FETCH_FAILED',
    public readonly attempts?: TranscriptAttemptInfo[]
  ) {
    super(message)
    this.name = 'TranscriptProbeError'
  }
}

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
    /youtube\.com\/v\/([\w-]{11})/
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  return null
}

export function toWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim()
}

function buildPreview(text: string): string {
  return text.length > PREVIEW_CHARS
    ? `${text.slice(0, PREVIEW_CHARS).trim()}…`
    : text
}

export interface TranscriptProbeResult {
  videoId: string
  text: string
  preview: string
  textLength: number
  wasClipped: boolean
}

export function prepareTranscriptPayload(
  rawText: string,
  videoId: string
): TranscriptProbeResult {
  const normalized = normalizeTranscriptText(rawText)

  if (normalized.length < MIN_TRANSCRIPT_CHARS) {
    throw new TranscriptProbeError(
      'Transcript too short or empty.',
      'NO_TRANSCRIPT'
    )
  }

  const wasClipped = normalized.length > MAX_TRANSCRIPT_CHARS
  const text =
    normalized.length > MAX_TRANSCRIPT_CHARS
      ? normalized.slice(0, MAX_TRANSCRIPT_CHARS).trim()
      : normalized

  return {
    videoId,
    text,
    preview: buildPreview(text),
    textLength: text.length,
    wasClipped
  }
}
