/**
 * Database Schemas - Barrel Export
 * Following Clean Architecture - Infrastructure layer
 * Central export point for all database schema definitions
 */

// MongoDB Schemas
export { PostModel, IPostDocument } from './mongodb/post/post.schema'
export { UserModel, UserDocument } from './mongodb/user/user.schema'
export { FileModel, FileDocument } from './mongodb/file/file.schema'
