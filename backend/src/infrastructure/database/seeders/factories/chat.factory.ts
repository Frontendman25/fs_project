import type { Faker } from '@faker-js/faker'

export interface GeneratedChatRoom {
  readonly name: string
  readonly type: 'public' | 'private'
  readonly description: string
}

export interface GeneratedChatMessage {
  readonly content: string
  readonly messageType: 'text' | 'system'
}

export function generateChatRoom(
  faker: Faker,
  index: number
): GeneratedChatRoom {
  return {
    name: `${faker.company.buzzNoun()}-${index}`,
    type: faker.helpers.arrayElement(['public', 'private'] as const),
    description: faker.company.catchPhrase()
  }
}

export function generateChatMessage(faker: Faker): GeneratedChatMessage {
  const isSystem = faker.number.int({ min: 0, max: 20 }) === 0
  return {
    content: isSystem ? 'User joined the room' : faker.lorem.sentence(),
    messageType: isSystem ? 'system' : 'text'
  }
}
