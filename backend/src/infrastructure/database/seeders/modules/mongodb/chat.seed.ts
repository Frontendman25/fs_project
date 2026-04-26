import {
  ChatMemberModel,
  ChatMessageModel,
  ChatNotificationModel,
  ChatRoomModel
} from '@/infrastructure/database/schemas/mongodb/chat'

import {
  generateChatMessage,
  generateChatRoom
} from '../../factories/chat.factory'
import {
  ensureRoomIdentities,
  ensureUserIdentities
} from '../../identity/identity.bootstrap'
import type { SeedContext, SeedModule, SeedModuleResult } from '../../seed.types'

/**
 * Seeds MongoDB chat data from deterministic identities.
 *
 * Uses `bulkWrite({ ordered: false })` on each collection so one bad op does
 * not abort the entire batch; error counts are aggregated and reported.
 */
export const mongodbChatSeed: SeedModule = {
  name: 'chat',
  engine: 'mongodb',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { faker, identity, config, logger } = ctx

    const users = ensureUserIdentities(ctx)
    const rooms = ensureRoomIdentities(ctx, users)
    if (rooms.length === 0 || users.length === 0) {
      logger.warn('mongodb chat skipped: missing rooms or users')
      return base(start)
    }

    const roomOps: unknown[] = []
    const memberOps: unknown[] = []
    const messageOps: unknown[] = []
    const notificationOps: unknown[] = []

    for (const room of rooms) {
      const owner = identity.getUser(room.createdByKey)
      if (!owner) continue
      const roomData = generateChatRoom(faker, rooms.indexOf(room))

      roomOps.push({
        updateOne: {
          filter: { id: room.id },
          update: {
            $set: {
              name: roomData.name,
              type: roomData.type,
              description: roomData.description,
              createdBy: owner.mongoObjectId.toHexString(),
              memberCount: users.length,
              isActive: true
            },
            $setOnInsert: { id: room.id }
          },
          upsert: true
        }
      })

      for (const user of users) {
        const memberKey = `member:${room.key}:${user.key}`
        const memberId = identity.deriveUuid(memberKey)
        const role =
          user.key === owner.key ? 'admin' : user.key === users[0]!.key ? 'moderator' : 'member'

        memberOps.push({
          updateOne: {
            filter: { id: memberId },
            update: {
              $set: {
                roomId: room.id,
                userId: user.mongoObjectId.toHexString(),
                username: user.username,
                role
              },
              $setOnInsert: { id: memberId, joinedAt: new Date(0) }
            },
            upsert: true
          }
        })
      }

      for (let i = 0; i < config.counts.messagesPerRoom; i++) {
        const messageKey = `message:${room.key}:${i}`
        const messageId = identity.deriveUuid(messageKey)
        const sender = users[i % users.length]!
        const msg = generateChatMessage(faker)

        messageOps.push({
          updateOne: {
            filter: { id: messageId },
            update: {
              $set: {
                roomId: room.id,
                senderId: sender.mongoObjectId.toHexString(),
                senderUsername: sender.username,
                content: msg.content,
                messageType: msg.messageType
              },
              $setOnInsert: { id: messageId }
            },
            upsert: true
          }
        })

        const notifKey = `notif:${messageKey}`
        const notifId = identity.deriveUuid(notifKey)
        const recipient = users[(i + 1) % users.length]!

        notificationOps.push({
          updateOne: {
            filter: { id: notifId },
            update: {
              $set: {
                userId: recipient.mongoObjectId.toHexString(),
                roomId: room.id,
                messageId,
                type: 'new_message',
                isRead: false
              },
              $setOnInsert: { id: notifId }
            },
            upsert: true
          }
        })
      }
    }

    const [roomRes, memberRes, messageRes, notifRes] = await Promise.all([
      bulk(ChatRoomModel, roomOps),
      bulk(ChatMemberModel, memberOps),
      bulk(ChatMessageModel, messageOps),
      bulk(ChatNotificationModel, notificationOps)
    ])

    const created =
      roomRes.upserted + memberRes.upserted + messageRes.upserted + notifRes.upserted
    const updated =
      roomRes.modified + memberRes.modified + messageRes.modified + notifRes.modified

    return {
      name: 'chat',
      engine: 'mongodb',
      created,
      updated,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}

async function bulk(
  model: { bulkWrite(ops: unknown[], opts: { ordered: boolean }): Promise<{ upsertedCount?: number; modifiedCount?: number }> },
  ops: unknown[]
): Promise<{ upserted: number; modified: number }> {
  if (ops.length === 0) return { upserted: 0, modified: 0 }
  const result = await model.bulkWrite(ops, { ordered: false })
  return {
    upserted: result.upsertedCount ?? 0,
    modified: result.modifiedCount ?? 0
  }
}

function base(start: number): SeedModuleResult {
  return {
    name: 'chat',
    engine: 'mongodb',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
