import { HttpResponse, http } from 'msw'

import { config } from '@/shared/config'
import type { LoginRequest, RegisterRequest } from '@/shared/types/api'

const loginUrl = `${config.api.baseUrl}/auth/login`
const registerUrl = `${config.api.baseUrl}/auth/register`

const mockUser = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

export const authHandlers = [
  http.post(loginUrl, async ({ request }) => {
    const credentials = (await request.json()) as LoginRequest

    if (
      credentials.username === 'alice' &&
      credentials.password === 'secret123'
    ) {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'tok',
          refreshToken: 'refresh'
        }
      })
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials'
      },
      { status: 401 }
    )
  }),
  http.post(registerUrl, async ({ request }) => {
    const body = (await request.json()) as RegisterRequest

    if (body.username === 'taken-user') {
      return HttpResponse.json(
        {
          success: false,
          message: 'Username already taken'
        },
        { status: 409 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          ...mockUser,
          username: body.username,
          email: body.email
        }
      }
    })
  })
]
