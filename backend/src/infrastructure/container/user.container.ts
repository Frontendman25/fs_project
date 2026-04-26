import { IDatabaseFactory } from '@/domain/repositories/database.factory'

import { FileUseCase } from '@/application/use-cases/file.use-case'
import { GetUserWithAvatarUseCase } from '@/application/use-cases/user/get-user-with-avatar.use-case'
import { GetUsersWithAvatarsUseCase } from '@/application/use-cases/user/get-users-with-avatars.use-case'
import { UpdateUserAvatarUseCase } from '@/application/use-cases/user/update-user-avatar.use-case'
import { RemoveUserAvatarUseCase } from '@/application/use-cases/user/remove-user-avatar.use-case'

import { UserController } from '@/presentation/controllers/user.controller'

import { FileContainer } from './file.container'

/**
 * User Container - Dependency injection container for user-related use-cases
 */
export class UserContainer {
  private getUserWithAvatarUseCase!: GetUserWithAvatarUseCase
  private getUsersWithAvatarsUseCase!: GetUsersWithAvatarsUseCase
  private updateUserAvatarUseCase!: UpdateUserAvatarUseCase
  private removeUserAvatarUseCase!: RemoveUserAvatarUseCase
  private userController!: UserController
  private databaseFactory: IDatabaseFactory
  private fileContainer: FileContainer
  private initialized = false

  constructor(databaseFactory: IDatabaseFactory, fileContainer: FileContainer) {
    this.databaseFactory = databaseFactory
    this.fileContainer = fileContainer
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      const userRepo = this.databaseFactory.getUserRepository()
      const fileRepo = this.fileContainer.getFileRepository()

      this.getUserWithAvatarUseCase = new GetUserWithAvatarUseCase(
        userRepo,
        fileRepo
      )
      this.getUsersWithAvatarsUseCase = new GetUsersWithAvatarsUseCase(
        this.getUserWithAvatarUseCase
      )
      this.updateUserAvatarUseCase = new UpdateUserAvatarUseCase(userRepo)
      this.removeUserAvatarUseCase = new RemoveUserAvatarUseCase(userRepo)

      this.userController = new UserController(
        this.getUserWithAvatarUseCase,
        this.updateUserAvatarUseCase,
        this.removeUserAvatarUseCase,
        this.fileContainer.getFileUseCase()
      )

      this.initialized = true
    }
  }

  getGetUserWithAvatarUseCase(): GetUserWithAvatarUseCase {
    this.ensureInitialized()
    return this.getUserWithAvatarUseCase
  }

  getGetUsersWithAvatarsUseCase(): GetUsersWithAvatarsUseCase {
    this.ensureInitialized()
    return this.getUsersWithAvatarsUseCase
  }

  getUpdateUserAvatarUseCase(): UpdateUserAvatarUseCase {
    this.ensureInitialized()
    return this.updateUserAvatarUseCase
  }

  getRemoveUserAvatarUseCase(): RemoveUserAvatarUseCase {
    this.ensureInitialized()
    return this.removeUserAvatarUseCase
  }

  getUserController(): UserController {
    this.ensureInitialized()
    return this.userController
  }

  cleanup(): void {
    console.log('UserContainer: Cleanup completed')
  }
}
