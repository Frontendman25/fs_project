/**
 * Integration Example - How to integrate UserController and UserRoutes
 * This file demonstrates how to add avatar upload functionality to your existing backend
 *
 * Follow these steps to integrate the avatar upload feature:
 */

import express from 'express'
import { createUserRoutes } from './presentation/routes/user.routes'
import { UserContainer } from './infrastructure/container/user.container'
import { FileContainer } from './infrastructure/container/file.container'
import { IDatabaseFactory } from './domain/repositories/database.factory'

/**
 * Example integration in your main index.ts file
 * Add these lines to your existing server setup
 */
export function integrateAvatarUpload(
  app: express.Application,
  databaseFactory: IDatabaseFactory
): void {
  const fileContainer = new FileContainer(databaseFactory)
  const userContainer = new UserContainer(databaseFactory, fileContainer)

  // 3. Create user routes with the user controller
  const userRoutes = createUserRoutes(userContainer.getUserController())

  // 4. Mount user routes (choose appropriate prefix)
  app.use('/api', userRoutes) // This will create POST /api/users/:id/avatar

  console.log('✅ Avatar upload feature integrated successfully')
  console.log('📋 Available endpoints:')
  console.log('   - POST /api/users/:id/avatar (Upload/update user avatar)')
}

/**
 * Alternative: If you want to mount user routes under a different prefix
 */
export function integrateAvatarUploadWithCustomPrefix(
  app: express.Application,
  databaseFactory: IDatabaseFactory,
  prefix: string = '/users'
): void {
  const fileContainer = new FileContainer(databaseFactory)
  const userContainer = new UserContainer(databaseFactory, fileContainer)
  const userRoutes = createUserRoutes(userContainer.getUserController())

  app.use(prefix, userRoutes) // This will create POST /users/users/:id/avatar

  console.log(`✅ Avatar upload feature integrated with prefix: ${prefix}`)
}

/**
 * Complete example of how your index.ts might look after integration
 */
export const COMPLETE_INTEGRATION_EXAMPLE = `
// In your main index.ts file, add these imports:
import { createUserRoutes } from './presentation/routes/user.routes'
import { UserContainer } from './infrastructure/container/user.container'
import { FileContainer } from './infrastructure/container/file.container'

// After your existing route setup, add:
const fileContainer = FileContainer.getInstance()
const userContainer = UserContainer.getInstance()

// Initialize user container with dependencies
userContainer.initializeWithDependencies(databaseFactory, fileContainer)

// Create and mount user routes
const userRoutes = createUserRoutes(userContainer.getUserController())
app.use('/api', userRoutes)

// Update your root endpoint to include the new avatar endpoint:
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'File Upload & Auth API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      files: '/api/files',
      upload: '/api/upload',
      users: '/api/users', // New!
      health: '/health'
    },
    features: [
      'User Authentication with JWT',
      'File Upload with Compression',
      'Avatar Upload for Users', // New!
      'Stream-based File Retrieval',
      'Multi-database Support (MongoDB/PostgreSQL)',
      'Multi-storage Support (Local/Cloudinary)',
      'Real-time Upload Events'
    ]
  })
})
`

/**
 * Usage example for testing the avatar upload endpoint
 */
export const USAGE_EXAMPLE = `
// Example usage with curl:
curl -X POST http://localhost:3100/api/users/123/avatar \\
  -H "Content-Type: multipart/form-data" \\
  -F "avatar=@/path/to/avatar.jpg"

// Example response:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "id": "file-uuid-here",
    "originalName": "avatar.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "compressedSize": 512000,
    "compressionRatio": 2.0,
    "isCompressed": true,
    "uploadedBy": "123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "url": "/files/file-uuid-here"
  }
}
`

/**
 * Frontend integration example (for your React frontend)
 */
export const FRONTEND_INTEGRATION_EXAMPLE = `
// In your frontend API client:
export const uploadUserAvatar = async (userId: string, file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  
  const response = await fetch(\`/api/users/\${userId}/avatar\`, {
    method: 'POST',
    body: formData,
    credentials: 'include' // For authentication cookies
  })
  
  return response.json()
}

// Usage in your AvatarUploader component:
const handleFileUpload = async (file: File) => {
  try {
    const result = await uploadUserAvatar(user.id, file)
    if (result.success) {
      // Update user state with new avatar URL
      dispatch(updateAvatar(result.data.url))
      toast.success('Avatar updated successfully!')
    }
  } catch (error) {
    toast.error('Failed to upload avatar')
  }
}
`
