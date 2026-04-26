import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CreatePostUseCase } from '@/application/use-cases/post/create-post.use-case'
import type { IPostRepository } from '@/domain/repositories/post.repository'
import type { Post } from '@/domain/entities/post.entity'

// ─── Test-data factories ──────────────────────────────────────────────────────

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    userId: 'user-1',
    content: 'Hello, world!',
    createdAt: new Date('2024-06-01'),
    ...overrides
  }
}

// ─── Repository mock factory ──────────────────────────────────────────────────

function makeMockPostRepo(
  overrides: Partial<IPostRepository> = {}
): IPostRepository {
  return {
    create: vi
      .fn<[{ userId: string; content: string }], Promise<Post>>()
      .mockResolvedValue(makePost()),
    findById: vi.fn().mockResolvedValue(null),
    findWithCursor: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    findWithUserAndCursor: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false }),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(true),
    countByUser: vi.fn().mockResolvedValue(0),
    existsAndBelongsToUser: vi.fn().mockResolvedValue(false),
    ...overrides
  }
}

// ─── Valid input fixtures ─────────────────────────────────────────────────────

const VALID_INPUT = {
  userId: 'user-1',
  content: 'A perfectly valid post.'
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreatePostUseCase', () => {
  let postRepo: IPostRepository
  let useCase: CreatePostUseCase

  beforeEach(() => {
    postRepo = makeMockPostRepo()
    useCase = new CreatePostUseCase(postRepo)
  })

  // ── Happy path ───────────────────────────────────────────────────────────────

  describe('execute — success', () => {
    it('returns the created post wrapped in { post }', async () => {
      const expected = makePost({
        userId: VALID_INPUT.userId,
        content: VALID_INPUT.content
      })
      vi.mocked(postRepo.create).mockResolvedValue(expected)

      const result = await useCase.execute({ data: VALID_INPUT })

      expect(result).toEqual({ post: expected })
    })

    it('passes the validated DTO directly to the repository', async () => {
      await useCase.execute({ data: VALID_INPUT })

      expect(postRepo.create).toHaveBeenCalledOnce()
      expect(postRepo.create).toHaveBeenCalledWith({
        userId: VALID_INPUT.userId,
        content: VALID_INPUT.content
      })
    })

    it('trims leading and trailing whitespace from content before saving', async () => {
      await useCase.execute({
        data: { ...VALID_INPUT, content: '  trimmed  ' }
      })

      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'trimmed' })
      )
    })
  })

  // ── Validation failures ──────────────────────────────────────────────────────
  //
  // validateCreatePostDTO uses Zod .parse() which throws ZodError.
  // The use-case wraps any non-ValidationError as:
  //   new Error(`Failed to create post: <original message>`)
  // so we assert on the wrapping prefix.

  describe('execute — input validation', () => {
    it('throws when userId is missing', async () => {
      await expect(
        useCase.execute({ data: { content: 'no user id here' } })
      ).rejects.toThrow('Failed to create post:')

      expect(postRepo.create).not.toHaveBeenCalled()
    })

    it('throws when userId is an empty string', async () => {
      await expect(
        useCase.execute({ data: { userId: '', content: 'some content' } })
      ).rejects.toThrow('Failed to create post:')

      expect(postRepo.create).not.toHaveBeenCalled()
    })

    it('throws when content is missing', async () => {
      await expect(
        useCase.execute({ data: { userId: 'user-1' } })
      ).rejects.toThrow('Failed to create post:')

      expect(postRepo.create).not.toHaveBeenCalled()
    })

    it('throws when content is an empty string', async () => {
      await expect(
        useCase.execute({ data: { userId: 'user-1', content: '' } })
      ).rejects.toThrow('Failed to create post:')

      expect(postRepo.create).not.toHaveBeenCalled()
    })

    it('throws when content exceeds 2000 characters', async () => {
      const tooLong = 'x'.repeat(2001)

      await expect(
        useCase.execute({ data: { userId: 'user-1', content: tooLong } })
      ).rejects.toThrow('Failed to create post:')

      expect(postRepo.create).not.toHaveBeenCalled()
    })

    it('accepts content that is exactly 2000 characters', async () => {
      const maxLength = 'x'.repeat(2000)

      await expect(
        useCase.execute({ data: { userId: 'user-1', content: maxLength } })
      ).resolves.toHaveProperty('post')
    })

    it('throws when the entire input is null', async () => {
      await expect(useCase.execute({ data: null })).rejects.toThrow(
        'Failed to create post:'
      )
    })
  })

  // ── Repository errors ────────────────────────────────────────────────────────

  describe('execute — repository errors', () => {
    it('wraps unexpected repository errors with a descriptive message', async () => {
      vi.mocked(postRepo.create).mockRejectedValue(
        new Error('DB connection lost')
      )

      await expect(useCase.execute({ data: VALID_INPUT })).rejects.toThrow(
        'Failed to create post: DB connection lost'
      )
    })

    it('wraps non-Error repository throws with "Unknown error"', async () => {
      vi.mocked(postRepo.create).mockRejectedValue('something weird')

      await expect(useCase.execute({ data: VALID_INPUT })).rejects.toThrow(
        'Failed to create post: Unknown error'
      )
    })
  })
})
