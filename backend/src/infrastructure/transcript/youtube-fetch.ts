import { ProxyAgent, fetch as undiciFetch } from 'undici'

let proxyAgent: ProxyAgent | undefined

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.YOUTUBE_TRANSCRIPT_PROXY_URL?.trim()
  if (!proxyUrl) return undefined

  if (!proxyAgent) {
    proxyAgent = new ProxyAgent(proxyUrl)
  }

  return proxyAgent
}

export function isYoutubeProxyConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_TRANSCRIPT_PROXY_URL?.trim())
}

export async function youtubeFetch(
  url: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  const agent = getProxyAgent()

  if (!agent) {
    return fetch(url, init)
  }

  const response = await undiciFetch(url, {
    ...init,
    dispatcher: agent
  } as Parameters<typeof undiciFetch>[1])

  return response as unknown as Response
}
