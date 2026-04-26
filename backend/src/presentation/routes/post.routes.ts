import { Router } from 'express'

import { PostController } from '@/presentation/controllers/post.controller'
import { AuthMiddleware } from '@/presentation/middleware/auth.middleware'

/**
 * Post Routes - Defines HTTP endpoints for post operations
 * This is part of the Presentation layer in Clean Architecture
 * Configures Express routes and connects them to the appropriate controllers
 * @param postController - Post controller instance with use case dependencies
 * @param authMiddleware - Auth middleware instance for authentication
 * @returns Express Router with post routes and error handling
 */
export function createPostRoutes(
  postController: PostController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router()

  // POST /posts - Create a new post
  router.post('/posts', postController.createPost)

  // GET /posts - Get posts with cursor pagination
  // Query params: ?userId=&cursor=&limit=
  router.get('/posts', postController.getPosts)

  // GET /posts/:id - Get a specific post by ID
  router.get('/posts/:id', postController.getPostById)

  // PUT /posts/:id - Update a post
  router.put('/posts/:id', postController.updatePost)

  // DELETE /posts/:id - Delete a post (requires authentication)
  router.delete(
    '/posts/:id',
    authMiddleware.authenticateToken,
    postController.deletePost
  )

  // GET /posts/count/:userId - Get post count for a user
  router.get('/posts/count/:userId', postController.getPostCount)

  return router
}
