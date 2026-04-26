import { Request, Response } from 'express'
import {
  CreatePostUseCase,
  GetPostsUseCase,
  GetPostByIdUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetPostCountUseCase
} from '../../application/use-cases/post'
import { asyncHandler } from '../../utils/asyncHandler'

/**
 * Post Controller - Handles HTTP requests for post operations
 * This is part of the Presentation layer in Clean Architecture
 * Manages post-related endpoints including CRUD operations and pagination
 */
export class PostController {
  constructor(
    private createPostUseCase: CreatePostUseCase,
    private getPostsUseCase: GetPostsUseCase,
    private getPostByIdUseCase: GetPostByIdUseCase,
    private updatePostUseCase: UpdatePostUseCase,
    private deletePostUseCase: DeletePostUseCase,
    private getPostCountUseCase: GetPostCountUseCase
  ) {}

  /**
   * Create a new post
   * POST /posts
   * @param req - Express request object
   * @param res - Express response object
   */
  createPost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.createPostUseCase.execute({
        data: req.body
      })

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: result.post
      })
    }
  )

  /**
   * Get posts with cursor pagination
   * GET /posts?userId=&cursor=&limit=
   * @param req - Express request object
   * @param res - Express response object
   */
  getPosts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.getPostsUseCase.execute({
        query: req.query
      })

      res.json({
        success: true,
        data: result.posts.data,
        pagination: {
          nextCursor: result.posts.nextCursor,
          hasMore: result.posts.hasMore
        }
      })
    }
  )

  /**
   * Get a specific post by ID
   * GET /posts/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  getPostById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.getPostByIdUseCase.execute({
        params: req.params
      })

      res.json({
        success: true,
        data: result.post
      })
    }
  )

  /**
   * Update a post
   * PUT /posts/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  updatePost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.body.userId || (req as any).user?.id // Support both body and auth middleware

      const result = await this.updatePostUseCase.execute({
        params: req.params,
        data: req.body,
        userId
      })

      res.json({
        success: true,
        message: 'Post updated successfully',
        data: result.post
      })
    }
  )

  /**
   * Delete a post
   * DELETE /posts/:id
   * @param req - Express request object
   * @param res - Express response object
   */
  deletePost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // For DELETE requests, userId comes from auth middleware (req.user.id)
      // and postId comes from URL params (req.params.id)
      const userId = req.user?.id as string

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID is required for deletion'
        })
      }

      await this.deletePostUseCase.execute({
        params: req.params,
        userId
      })

      res.json({
        success: true,
        message: 'Post deleted successfully'
      })
    }
  )

  /**
   * Get post count for a user
   * GET /posts/count/:userId
   * @param req - Express request object
   * @param res - Express response object
   */
  getPostCount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.getPostCountUseCase.execute({
        params: req.params
      })

      res.json({
        success: true,
        data: { count: result.count }
      })
    }
  )
}
