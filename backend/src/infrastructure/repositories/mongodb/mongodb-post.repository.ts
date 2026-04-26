import mongoose from 'mongoose'

import { IPostRepository } from '@/domain/repositories/post.repository'
import { ILoggerService } from '@/domain/services/logger.service'
import { PAGINATION_CONFIG } from '@/domain/config'
import {
  Post,
  CreatePostData,
  UpdatePostData,
  CursorPaginationParams,
  CursorPaginationResult,
  PostWithUser
} from '@/domain/entities/post.entity'

import { PostModel } from '@/infrastructure/database/schemas/mongodb/post'

/**
 * MongoDB Post Repository - Mongoose implementation
 * This is part of the Infrastructure layer in Clean Architecture
 * Implements IPostRepository using Mongoose ODM for MongoDB
 */
export class MongoDBPostRepository implements IPostRepository {
  private logger: ILoggerService

  constructor(logger: ILoggerService) {
    this.logger = logger.child({ service: 'MongoDBPostRepository' })
  }

  async create(postData: CreatePostData): Promise<Post> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postData.userId)) {
        throw new Error('Invalid userId')
      }

      const post = new PostModel({
        userId: new mongoose.Types.ObjectId(postData.userId),
        content: postData.content
      })

      const savedPost = await post.save()

      return {
        id: savedPost._id.toString(),
        userId: savedPost.userId.toString(),
        content: savedPost.content,
        createdAt: savedPost.createdAt,
        updatedAt: savedPost.updatedAt
      }
    } catch (err: any) {
      this.logger.error({ error: err, postData }, 'Failed to create post')
      throw new Error(`Post creation failed: ${err.message}`)
    }
  }

  async findById(id: string): Promise<Post | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }

    const post = await PostModel.findById(id)
    if (!post) return null

    return {
      id: post._id.toString(),
      userId: post.userId.toString(),
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }
  }

  async findWithCursor(
    params: CursorPaginationParams
  ): Promise<CursorPaginationResult<Post>> {
    const { cursor, limit = 20, userId } = params
    const take = Math.min(limit, 100)

    const query: any = {}
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId)
    }
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    const posts = await PostModel.find(query)
      .sort({ createdAt: -1 })
      .limit(take + 1)
      .lean()

    const hasMore = posts.length > take
    const data = hasMore ? posts.slice(0, take) : posts
    const nextCursor = hasMore
      ? data[data.length - 1]?.createdAt.toISOString()
      : undefined

    return {
      data: data.map((post) => ({
        id: post._id.toString(),
        userId: post.userId.toString(),
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })),
      nextCursor,
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

    const query: any = {}
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId)
    }
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    const posts = await PostModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userId: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          'user.id': '$user._id',
          'user.username': '$user.username',
          'user.email': '$user.email'
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: take + 1 }
    ])

    const hasMore = posts.length > take
    const data = hasMore ? posts.slice(0, take) : posts
    const nextCursor = hasMore
      ? data[data.length - 1]?.createdAt.toISOString()
      : undefined

    return {
      data: data.map((post) => ({
        id: post._id.toString(),
        userId: post.userId.toString(),
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.user.id.toString(),
          username: post.user.username,
          email: post.user.email
        }
      })),
      nextCursor,
      hasMore
    }
  }

  async update(id: string, updateData: UpdatePostData): Promise<Post | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }

    const post = await PostModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )

    if (!post) return null

    return {
      id: post._id.toString(),
      userId: post.userId.toString(),
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false
    }

    const result = await PostModel.findByIdAndDelete(id)

    return !!result
  }

  async countByUser(userId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return 0
    }

    return await PostModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId)
    })
  }

  async existsAndBelongsToUser(id: string, userId: string): Promise<boolean> {
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return false
    }

    const post = await PostModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId)
    })

    return !!post
  }
}
