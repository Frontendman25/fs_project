import type { Faker } from '@faker-js/faker'

export interface GeneratedPost {
  readonly content: string
}

export function generatePost(faker: Faker): GeneratedPost {
  const paragraphs = faker.number.int({ min: 1, max: 3 })
  return {
    content: faker.lorem.paragraphs(paragraphs, '\n\n').slice(0, 2000)
  }
}
