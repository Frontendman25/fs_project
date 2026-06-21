import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GetUserWithAvatarUseCase } from '@/application/use-cases/user/get-user-with-avatar.use-case'
import { GetUsersWithAvatarsUseCase } from '@/application/use-cases/user/get-users-with-avatars.use-case'
import { UpdateUserAvatarUseCase } from '@/application/use-cases/user/update-user-avatar.use-case'
import { RemoveUserAvatarUseCase } from '@/application/use-cases/user/remove-user-avatar.use-case'

import type { IUserRepository } from '@/domain/repositories/user.repository'
import type { IFileRepository } from '@/domain/repositories/file.repository'
import type { User } from '@/domain/entities/user.entity'
import type { File } from '@/domain/entities/file.entity'

// ─── Test-data factories ──────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'alice',
    password: 'hashed_pw',
    email: 'alice@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  }
}

function makeFile(overrides: Partial<File> = {}): File {
  return {
    id: 'file-1',
    originalName: 'avatar.jpg',
    filename: 'avatar-stored.jpg',
    mimeType: 'image/jpeg',
    size: 2048,
    compressedSize: 1600,
    path: 'https://res.cloudinary.com/demo/avatar.jpg',
    isCompressed: true,
    compressionRatio: 1.28,
    checksum: 'abc123',
    storageType: 'cloudinary',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  }
}

// ─── Repository mock factories ────────────────────────────────────────────────

function makeMockUserRepo(
  overrides: Partial<IUserRepository> = {}
): IUserRepository {
  return {
    findById: vi.fn<[string], Promise<User | null>>().mockResolvedValue(null),
    findByUsername: vi
      .fn<[string], Promise<User | null>>()
      .mockResolvedValue(null),
    findByEmail: vi
      .fn<[string], Promise<User | null>>()
      .mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeUser()),
    update: vi
      .fn<[string, Partial<User>], Promise<User | null>>()
      .mockResolvedValue(null),
    delete: vi.fn<[string], Promise<boolean>>().mockResolvedValue(true),
    findAll: vi.fn<[], Promise<User[]>>().mockResolvedValue([]),
    ...overrides
  }
}

function makeMockFileRepo(
  overrides: Partial<IFileRepository> = {}
): IFileRepository {
  return {
    findById: vi.fn<[string], Promise<File | null>>().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeFile()),
    findByUserId: vi.fn().mockResolvedValue([]),
    findByNamePattern: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(true),
    findAll: vi.fn().mockResolvedValue([]),
    findWithPagination: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findByMimeType: vi.fn().mockResolvedValue([]),
    ...overrides
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('User avatar use-cases', () => {
  let userRepo: IUserRepository
  let fileRepo: IFileRepository
  let getUserWithAvatar: GetUserWithAvatarUseCase
  let getUsersWithAvatars: GetUsersWithAvatarsUseCase
  let updateUserAvatar: UpdateUserAvatarUseCase
  let removeUserAvatar: RemoveUserAvatarUseCase

  beforeEach(() => {
    userRepo = makeMockUserRepo()
    fileRepo = makeMockFileRepo()
    getUserWithAvatar = new GetUserWithAvatarUseCase(userRepo, fileRepo)
    getUsersWithAvatars = new GetUsersWithAvatarsUseCase(getUserWithAvatar)
    updateUserAvatar = new UpdateUserAvatarUseCase(userRepo)
    removeUserAvatar = new RemoveUserAvatarUseCase(userRepo)
  })

  describe('GetUserWithAvatarUseCase', () => {
    it('returns null when the user does not exist', async () => {
      const result = await getUserWithAvatar.execute('nonexistent')

      expect(result).toBeNull()
      expect(userRepo.findById).toHaveBeenCalledOnce()
      expect(userRepo.findById).toHaveBeenCalledWith('nonexistent')
    })

    it('returns the user with null avatarFile when user has no avatarFileId', async () => {
      const user = makeUser({ avatarFileId: undefined })
      vi.mocked(userRepo.findById).mockResolvedValue(user)

      const result = await getUserWithAvatar.execute(user.id)

      expect(result).not.toBeNull()
      expect(result!.avatarFile).toBeNull()
      expect(fileRepo.findById).not.toHaveBeenCalled()
    })

    it('returns the user with avatarFile when avatar file exists', async () => {
      const file = makeFile({ path: 'https://cdn.example.com/avatar.jpg' })
      const user = makeUser({ avatarFileId: file.id })

      vi.mocked(userRepo.findById).mockResolvedValue(user)
      vi.mocked(fileRepo.findById).mockResolvedValue(file)

      const result = await getUserWithAvatar.execute(user.id)

      expect(result!.avatarFile).toStrictEqual(file)
      expect(fileRepo.findById).toHaveBeenCalledWith(file.id)
    })

    it('returns the user with null avatarFile when avatar file is not found', async () => {
      const user = makeUser({ avatarFileId: 'file-orphaned' })
      vi.mocked(userRepo.findById).mockResolvedValue(user)
      vi.mocked(fileRepo.findById).mockResolvedValue(null)

      const result = await getUserWithAvatar.execute(user.id)

      expect(result!.avatarFile).toBeNull()
    })

    it('returns the user with null avatarFile and does not throw when fileRepo rejects', async () => {
      const user = makeUser({ avatarFileId: 'file-1' })
      vi.mocked(userRepo.findById).mockResolvedValue(user)
      vi.mocked(fileRepo.findById).mockRejectedValue(
        new Error('Storage unavailable')
      )

      await expect(getUserWithAvatar.execute(user.id)).resolves.toMatchObject({
        id: user.id,
        avatarFile: null
      })
    })

    it('spreads all user fields onto the returned object', async () => {
      const user = makeUser({ email: 'alice@example.com' })
      vi.mocked(userRepo.findById).mockResolvedValue(user)

      const result = await getUserWithAvatar.execute(user.id)

      expect(result).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email
      })
    })
  })

  describe('GetUsersWithAvatarsUseCase', () => {
    it('returns an empty array when given an empty list', async () => {
      const result = await getUsersWithAvatars.execute([])
      expect(result).toEqual([])
    })

    it('returns users for all found IDs, skipping not-found ones', async () => {
      const userA = makeUser({ id: 'user-a' })
      const userC = makeUser({ id: 'user-c' })

      vi.mocked(userRepo.findById)
        .mockResolvedValueOnce(userA)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(userC)

      const result = await getUsersWithAvatars.execute([
        'user-a',
        'user-b',
        'user-c'
      ])

      expect(result).toHaveLength(2)
      expect(result.map((u) => u.id)).toEqual(['user-a', 'user-c'])
    })

    it('resolves all users in parallel (Promise.all)', async () => {
      const users = ['u1', 'u2', 'u3'].map((id) => makeUser({ id }))

      vi.mocked(userRepo.findById)
        .mockResolvedValueOnce(users[0]!)
        .mockResolvedValueOnce(users[1]!)
        .mockResolvedValueOnce(users[2]!)

      const result = await getUsersWithAvatars.execute(['u1', 'u2', 'u3'])

      expect(result).toHaveLength(3)
      expect(userRepo.findById).toHaveBeenCalledTimes(3)
    })
  })

  describe('UpdateUserAvatarUseCase', () => {
    it('calls userRepository.update with the new avatarFileId and returns the result', async () => {
      const updated = makeUser({ avatarFileId: 'file-new' })
      vi.mocked(userRepo.update).mockResolvedValue(updated)

      const result = await updateUserAvatar.execute('user-1', 'file-new')

      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        avatarFileId: 'file-new'
      })
      expect(result).toStrictEqual(updated)
    })

    it('returns null when the user does not exist', async () => {
      vi.mocked(userRepo.update).mockResolvedValue(null)

      const result = await updateUserAvatar.execute('ghost', 'file-1')

      expect(result).toBeNull()
    })
  })

  describe('RemoveUserAvatarUseCase', () => {
    it('calls userRepository.update with avatarFileId: undefined', async () => {
      const updated = makeUser({ avatarFileId: undefined })
      vi.mocked(userRepo.update).mockResolvedValue(updated)

      await removeUserAvatar.execute('user-1')

      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        avatarFileId: null
      })
    })

    it('returns null when the user does not exist', async () => {
      vi.mocked(userRepo.update).mockResolvedValue(null)

      const result = await removeUserAvatar.execute('ghost')

      expect(result).toBeNull()
    })
  })
})
