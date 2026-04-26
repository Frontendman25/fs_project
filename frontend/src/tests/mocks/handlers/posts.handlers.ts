import { HttpResponse, http } from 'msw'

import { config } from '@/shared/config'

const createPostUrl = `${config.api.baseUrl}/api/posts`

export const postsHandlers = [
  http.post(createPostUrl, async ({ request }) => {
    const body = (await request.json()) as { userId: string; content: string }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'post-1',
        userId: body.userId,
        content: body.content,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    })
  })
]
