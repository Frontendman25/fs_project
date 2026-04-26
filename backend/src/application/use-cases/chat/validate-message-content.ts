import { InvalidMessageContentError } from '@/domain/errors/chat.errors'

export function validateMessageContent(
  content: string,
  messageType?: string
): void {
  if (!content || content.trim().length === 0) {
    throw new InvalidMessageContentError('Message content cannot be empty')
  }

  if (content.length > 4000) {
    throw new InvalidMessageContentError(
      'Message content is too long (max 4000 characters)'
    )
  }

  if (messageType === 'text' && content.length > 2000) {
    throw new InvalidMessageContentError(
      'Text message is too long (max 2000 characters)'
    )
  }
}
