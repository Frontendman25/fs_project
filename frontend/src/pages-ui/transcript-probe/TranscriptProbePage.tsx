'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { config } from '@/shared/config'

const TRANSCRIPT_LANGUAGES = [
  { code: 'fr', label: 'French (fr)' },
  { code: 'de', label: 'German (de)' },
  { code: 'en', label: 'English (en)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'it', label: 'Italian (it)' },
  { code: 'pt', label: 'Portuguese (pt)' },
  { code: 'pl', label: 'Polish (pl)' },
  { code: 'ru', label: 'Russian (ru)' },
  { code: 'ja', label: 'Japanese (ja)' },
  { code: 'ko', label: 'Korean (ko)' },
  { code: 'nl', label: 'Dutch (nl)' },
  { code: 'sv', label: 'Swedish (sv)' }
] as const

interface TranscriptAttempt {
  source: string
  ok: boolean
  durationMs: number
  error?: string
}

interface TranscriptProbeData {
  videoId: string
  lang: string
  source: string
  host: string
  text: string
  preview: string
  textLength: number
  wasClipped: boolean
  attempts: TranscriptAttempt[]
}

interface ProbeSuccessResponse {
  success: true
  data: TranscriptProbeData
}

interface ProbeErrorResponse {
  success: false
  error: string
  code?: string
  attempts?: TranscriptAttempt[]
}

type ProbeResponse = ProbeSuccessResponse | ProbeErrorResponse

const defaultToken = process.env.NEXT_PUBLIC_DEBUG_TRANSCRIPT_TOKEN ?? ''

export function TranscriptProbePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [lang, setLang] = useState('fr')
  const [debugToken, setDebugToken] = useState(defaultToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<TranscriptAttempt[] | null>(null)
  const [result, setResult] = useState<TranscriptProbeData | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setAttempts(null)
    setResult(null)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)

      const response = await fetch(
        `${config.api.baseUrl}/api/debug/transcript`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-debug-token': debugToken.trim()
          },
          body: JSON.stringify({ videoUrl: videoUrl.trim(), lang }),
          signal: controller.signal
        }
      )

      clearTimeout(timeout)

      const payload = (await response.json()) as ProbeResponse

      if (!response.ok || payload.success === false) {
        const failed = payload as ProbeErrorResponse
        setError(failed.error || 'Request failed')
        setAttempts(failed.attempts ?? null)
        return
      }

      setResult(payload.data)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out after 60s (Render cold start?)')
      } else {
        setError(err instanceof Error ? err.message : 'Network error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            YouTube transcript probe
          </h1>
          <p className="text-sm text-gray-600">
            Fetch captions from a YouTube video in the language you want to
            learn (e.g. French for a German learner).
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="videoUrl">
              YouTube URL
            </label>
            <Input
              id="videoUrl"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="lang">
              Caption language
            </label>
            <select
              id="lang"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {TRANSCRIPT_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="debugToken">
              Debug token
            </label>
            <Input
              id="debugToken"
              type="password"
              placeholder="Same as DEBUG_TRANSCRIPT_TOKEN on API"
              value={debugToken}
              onChange={(e) => setDebugToken(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Fetching…' : 'Fetch transcript'}
          </Button>
        </form>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {attempts && attempts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Attempts</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              {attempts.map((attempt) => (
                <li key={attempt.source}>
                  <span className="font-medium">{attempt.source}</span>:{' '}
                  {attempt.ok ? `ok (${attempt.durationMs} ms)` : attempt.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>video: {result.videoId}</span>
              <span>lang: {result.lang}</span>
              <span>source: {result.source}</span>
              <span>host: {result.host}</span>
              <span>{result.textLength} chars</span>
              {result.wasClipped && <span>clipped</span>}
            </div>

            <Textarea
              readOnly
              className="min-h-64 font-mono text-sm"
              value={result.text}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default TranscriptProbePage
