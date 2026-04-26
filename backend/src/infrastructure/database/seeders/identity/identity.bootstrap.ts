import type { SeedContext } from '../seed.types'
import { generateUser } from '../factories/user.factory'
import type {
  FileIdentity,
  PostIdentity,
  RoomIdentity,
  UserIdentity
} from './identity-map'

export function ensureUserIdentities(ctx: SeedContext): readonly UserIdentity[] {
  const users: UserIdentity[] = []

  for (let i = 0; i < ctx.config.counts.users; i++) {
    const key = `user:${i}`
    const existing = ctx.identity.getUser(key)
    if (existing) {
      users.push(existing)
      continue
    }

    const profile = generateUser(ctx.faker, i)
    const created: UserIdentity = {
      key,
      pgId: ctx.identity.deriveUuid(key),
      mongoObjectId: ctx.identity.deriveObjectId(key),
      username: profile.username,
      email: profile.email
    }
    ctx.identity.registerUser(key, created)
    users.push(created)
  }

  return users
}

export function ensurePostIdentities(
  ctx: SeedContext,
  users: readonly UserIdentity[]
): readonly PostIdentity[] {
  const posts: PostIdentity[] = []

  for (const user of users) {
    for (let i = 0; i < ctx.config.counts.postsPerUser; i++) {
      const key = `post:${user.key}:${i}`
      const created: PostIdentity = {
        key,
        pgId: ctx.identity.deriveUuid(key),
        mongoObjectId: ctx.identity.deriveObjectId(key),
        userKey: user.key
      }
      ctx.identity.registerPost(key, created)
      posts.push(created)
    }
  }

  return posts
}

export function ensureFileIdentities(
  ctx: SeedContext,
  users: readonly UserIdentity[]
): readonly FileIdentity[] {
  const files: FileIdentity[] = []

  for (const user of users) {
    for (let i = 0; i < ctx.config.counts.filesPerUser; i++) {
      const key = `file:${user.key}:${i}`
      const created: FileIdentity = {
        key,
        pgId: ctx.identity.deriveUuid(key),
        mongoObjectId: ctx.identity.deriveObjectId(key),
        ownerKey: user.key
      }
      ctx.identity.registerFile(key, created)
      files.push(created)
    }
  }

  return files
}

export function ensureRoomIdentities(
  ctx: SeedContext,
  users: readonly UserIdentity[]
): readonly RoomIdentity[] {
  const rooms: RoomIdentity[] = []

  for (let i = 0; i < ctx.config.counts.chatRooms; i++) {
    const key = `room:${i}`
    const owner = users[i % users.length]
    if (!owner) {
      continue
    }
    const room: RoomIdentity = {
      key,
      id: ctx.identity.deriveUuid(key),
      createdByKey: owner.key
    }
    ctx.identity.registerRoom(key, room)
    rooms.push(room)
  }

  return rooms
}
