import {
  generateChatMessage,
  generateChatRoom
} from '../../factories/chat.factory'
import type {
  SeedContext,
  SeedModule,
  SeedModuleResult
} from '../../seed.types'

/**
 * Seeds chat in Postgres: rooms, members, messages, notifications.
 *
 * Room ids, message ids, and membership ids are deterministically derived so
 * the MongoDB chat module can mirror them using the exact same strings.
 */
export const postgresChatSeed: SeedModule = {
  name: 'chat',
  engine: 'postgres',

  async run(ctx: SeedContext): Promise<SeedModuleResult> {
    const start = Date.now()
    const { prisma, faker, identity, config, logger } = ctx

    const users = identity.allUsers()
    if (users.length < 2) {
      logger.warn(
        { users: users.length },
        'chat seed skipped: need at least 2 users'
      )
      return baseResult(start)
    }

    let created = 0
    let updated = 0

    await prisma.$transaction(async (tx) => {
      for (let roomIdx = 0; roomIdx < config.counts.chatRooms; roomIdx++) {
        const roomKey = `room:${roomIdx}`
        const roomId = identity.deriveUuid(roomKey)
        const owner = users[roomIdx % users.length]!
        const roomData = generateChatRoom(faker, roomIdx)

        identity.registerRoom(roomKey, {
          key: roomKey,
          id: roomId,
          createdByKey: owner.key
        })

        const roomExisting = await tx.chatRoom.findUnique({
          where: { id: roomId }
        })
        const memberCount = users.length

        await tx.chatRoom.upsert({
          where: { id: roomId },
          create: {
            id: roomId,
            name: roomData.name,
            type: roomData.type,
            description: roomData.description,
            createdBy: owner.pgId,
            memberCount,
            isActive: true
          },
          update: {
            name: roomData.name,
            type: roomData.type,
            description: roomData.description,
            memberCount
          }
        })
        if (roomExisting) updated++
        else created++

        for (const user of users) {
          const memberKey = `member:${roomKey}:${user.key}`
          const memberId = identity.deriveUuid(memberKey)
          const role =
            user.key === owner.key
              ? 'admin'
              : faker.helpers.arrayElement(['moderator', 'member'] as const)

          const memberExisting = await tx.chatMember.findUnique({
            where: { id: memberId }
          })

          await tx.chatMember.upsert({
            where: { id: memberId },
            create: {
              id: memberId,
              roomId,
              userId: user.pgId,
              username: user.username,
              role
            },
            update: {
              role,
              username: user.username
            }
          })
          if (memberExisting) updated++
          else created++
        }

        for (let msgIdx = 0; msgIdx < config.counts.messagesPerRoom; msgIdx++) {
          const messageKey = `message:${roomKey}:${msgIdx}`
          const messageId = identity.deriveUuid(messageKey)
          const sender = users[msgIdx % users.length]!
          const msgData = generateChatMessage(faker)

          const msgExisting = await tx.chatMessage.findUnique({
            where: { id: messageId }
          })

          await tx.chatMessage.upsert({
            where: { id: messageId },
            create: {
              id: messageId,
              roomId,
              senderId: sender.pgId,
              senderUsername: sender.username,
              content: msgData.content,
              messageType: msgData.messageType
            },
            update: {
              content: msgData.content,
              messageType: msgData.messageType,
              senderUsername: sender.username
            }
          })
          if (msgExisting) updated++
          else created++

          const notifKey = `notif:${messageKey}`
          const notifId = identity.deriveUuid(notifKey)
          const recipient = users[(msgIdx + 1) % users.length]!

          const notifExisting = await tx.chatNotification.findUnique({
            where: { id: notifId }
          })

          await tx.chatNotification.upsert({
            where: { id: notifId },
            create: {
              id: notifId,
              userId: recipient.pgId,
              roomId,
              messageId,
              type: 'new_message'
            },
            update: { isRead: false }
          })
          if (notifExisting) updated++
          else created++
        }
      }
    })

    return {
      name: 'chat',
      engine: 'postgres',
      created,
      updated,
      skipped: 0,
      durationMs: Date.now() - start
    }
  }
}

function baseResult(start: number): SeedModuleResult {
  return {
    name: 'chat',
    engine: 'postgres',
    created: 0,
    updated: 0,
    skipped: 0,
    durationMs: Date.now() - start
  }
}
