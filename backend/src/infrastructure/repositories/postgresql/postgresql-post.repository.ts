import { PrismaClient } from '@prisma/client'

import { PAGINATION_CONFIG } from '@/domain/config'
import { IPostRepository } from '@/domain/repositories/post.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import {
  Post,
  CreatePostData,
  UpdatePostData,
  CursorPaginationParams,
  CursorPaginationResult,
  PostWithUser
} from '@/domain/entities/post.entity'

/**
 * PostgreSQL Post Repository - Prisma implementation
 * Following Clean Architecture - Infrastructure layer
 * Implements IPostRepository using Prisma ORM for PostgreSQL
 */
export class PostgreSQLPostRepository implements IPostRepository {
  private logger: ILoggerService

  constructor(
    private prisma: PrismaClient,
    logger: ILoggerService
  ) {
    this.logger = logger.child({ service: 'PostgreSQLPostRepository' })
  }

  async create(postData: CreatePostData): Promise<Post> {
    const post = await this.prisma.post.create({
      data: {
        userId: postData.userId,
        content: postData.content
      }
    })

    return this.mapPrismaToPost(post)
  }

  async findById(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id }
    })

    return post ? this.mapPrismaToPost(post) : null
  }

  async findWithCursor(
    params: CursorPaginationParams
  ): Promise<CursorPaginationResult<Post>> {
    const {
      cursor,
      limit = PAGINATION_CONFIG.DEFAULT_POST_LIMIT,
      userId
    } = params
    const take = Math.min(limit, PAGINATION_CONFIG.MAX_POST_LIMIT)

    const where = userId ? { userId } : {}

    const posts = await this.prisma.post.findMany({
      where: {
        ...where,
        ...(cursor && { createdAt: { lt: new Date(cursor) } })
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1 // Get one extra to check if there are more
    })

    const hasMore = posts.length > take
    const data = hasMore ? posts.slice(0, take) : posts

    return {
      data: data.map((post: any) => this.mapPrismaToPost(post)),
      nextCursor:
        data.length > 0
          ? data[data.length - 1].createdAt.toISOString()
          : undefined,
      hasMore
    }
  }

  async findWithUserAndCursor(
    params: CursorPaginationParams
  ): Promise<CursorPaginationResult<PostWithUser>> {
    const {
      cursor,
      limit = PAGINATION_CONFIG.DEFAULT_POST_LIMIT,
      userId
    } = params
    const take = Math.min(limit, PAGINATION_CONFIG.MAX_POST_LIMIT)

    const where = userId ? { userId } : {}

    const posts = await this.prisma.post.findMany({
      where: {
        ...where,
        ...(cursor && { createdAt: { lt: new Date(cursor) } })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1 // Get one extra to check if there are more
    })

    const hasMore = posts.length > take
    const data = hasMore ? posts.slice(0, take) : posts

    return {
      data: data.map((post: any) => this.mapPrismaToPostWithUser(post)),
      nextCursor:
        data.length > 0
          ? data[data.length - 1].createdAt.toISOString()
          : undefined,
      hasMore
    }
  }

  async update(id: string, updateData: UpdatePostData): Promise<Post | null> {
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          content: updateData.content
        }
      })

      return this.mapPrismaToPost(post)
    } catch (error) {
      this.logger.error({ error, id, updateData }, 'Failed to update post')
      // Handle case where post doesn't exist
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.post.delete({
        where: { id }
      })
      return true
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete post')
      return false
    }
  }

  async countByUser(userId: string): Promise<number> {
    const count = await this.prisma.post.count({
      where: { userId }
    })

    return count
  }

  async existsAndBelongsToUser(id: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        userId
      }
    })

    return !!post
  }

  /**
   * Map Prisma Post to domain Post entity
   */
  private mapPrismaToPost(prismaPost: any): Post {
    return {
      id: prismaPost.id,
      userId: prismaPost.userId,
      content: prismaPost.content,
      createdAt: prismaPost.createdAt,
      updatedAt: prismaPost.updatedAt
    }
  }

  /**
   * Map Prisma Post with User to domain PostWithUser entity
   */
  private mapPrismaToPostWithUser(prismaPost: any): PostWithUser {
    return {
      id: prismaPost.id,
      userId: prismaPost.userId,
      content: prismaPost.content,
      createdAt: prismaPost.createdAt,
      updatedAt: prismaPost.updatedAt,
      user: {
        id: prismaPost.user.id,
        username: prismaPost.user.username,
        email: prismaPost.user.email
      }
    }
  }
}
