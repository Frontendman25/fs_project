import { Types } from 'mongoose'
import { v5 as uuidv5, validate as uuidValidate } from 'uuid'

/**
 * Cross-database identity mapping.
 *
 * Design decision
 * ---------------
 * Each logical entity (e.g. "user #3", "post #12 of user #3") is addressed by
 * a stable `externalKey` that does not depend on any storage engine. From that
 * key we derive engine-specific identifiers via UUIDv5 in a shared namespace.
 *
 * - Postgres (Prisma): all primary keys are `String` — we pass the derived
 *   UUIDv5 directly, which makes `upsert` idempotent across runs.
 * - MongoDB string ids (chat_*): we also use the UUIDv5 as `id`, upserting on it.
 * - MongoDB `_id: ObjectId` (posts): ObjectId is 12 bytes, so we take the first
 *   12 bytes of the UUIDv5 buffer — still deterministic and collision-free
 *   for our seed volumes.
 *
 * Trade-off: ObjectId derived from a UUID loses ObjectId's time prefix, but
 * that is acceptable for seed data. Production writes still use native
 * ObjectId generation.
 */
export class IdentityMap {
  private readonly namespace: string
  private readonly users: Map<string, UserIdentity> = new Map()
  private readonly posts: Map<string, PostIdentity> = new Map()
  private readonly files: Map<string, FileIdentity> = new Map()
  private readonly rooms: Map<string, RoomIdentity> = new Map()

  constructor(namespace: string) {
    if (!uuidValidate(namespace)) {
      throw new Error(
        `IdentityMap: namespace must be a valid UUID (got "${namespace}")`
      )
    }
    this.namespace = namespace
  }

  /** Deterministic UUIDv5 derived from an arbitrary external key. */
  deriveUuid(externalKey: string): string {
    return uuidv5(externalKey, this.namespace)
  }

  /** Deterministic Mongo ObjectId derived from an external key. */
  deriveObjectId(externalKey: string): Types.ObjectId {
    const uuid = this.deriveUuid(externalKey).replace(/-/g, '')
    return new Types.ObjectId(uuid.slice(0, 24))
  }

  registerUser(key: string, identity: UserIdentity): void {
    this.users.set(key, identity)
  }

  getUser(key: string): UserIdentity | undefined {
    return this.users.get(key)
  }

  allUsers(): readonly UserIdentity[] {
    return [...this.users.values()]
  }

  registerPost(key: string, identity: PostIdentity): void {
    this.posts.set(key, identity)
  }

  allPosts(): readonly PostIdentity[] {
    return [...this.posts.values()]
  }

  registerFile(key: string, identity: FileIdentity): void {
    this.files.set(key, identity)
  }

  allFiles(): readonly FileIdentity[] {
    return [...this.files.values()]
  }

  registerRoom(key: string, identity: RoomIdentity): void {
    this.rooms.set(key, identity)
  }

  getRoom(key: string): RoomIdentity | undefined {
    return this.rooms.get(key)
  }

  allRooms(): readonly RoomIdentity[] {
    return [...this.rooms.values()]
  }
}

export interface UserIdentity {
  readonly key: string
  readonly pgId: string
  readonly mongoObjectId: Types.ObjectId
  readonly username: string
  readonly email: string
}

export interface PostIdentity {
  readonly key: string
  readonly pgId: string
  readonly mongoObjectId: Types.ObjectId
  readonly userKey: string
}

export interface FileIdentity {
  readonly key: string
  readonly pgId: string
  readonly mongoObjectId: Types.ObjectId
  readonly ownerKey: string
}

export interface RoomIdentity {
  readonly key: string
  readonly id: string
  readonly createdByKey: string
}
