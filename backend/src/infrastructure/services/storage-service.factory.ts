import { IFileStorageService } from '../../domain/services/file-storage.service'
import { FileStorageService } from './file-storage.service'
import { CloudinaryStorageService } from './cloudinary-storage.service'

/**
 * Storage Service Factory - Creates appropriate storage service based on configuration
 * This is part of the Infrastructure layer in Clean Architecture
 * Allows switching between local and Cloudinary storage
 */
export class StorageServiceFactory {
  /**
   * Create a storage service based on configuration
   * @param storageType - Type of storage ('local' or 'cloudinary')
   * @param config - Configuration object for the storage service
   * @returns IFileStorageService implementation
   */
  static createStorageService(
    storageType: 'local' | 'cloudinary',
    config: StorageConfig
  ): IFileStorageService {
    switch (storageType.toLowerCase()) {
      case 'local':
        return new FileStorageService(config.local?.storagePath)

      case 'cloudinary':
        if (!config.cloudinary) {
          throw new Error(
            'Cloudinary configuration is required for cloudinary storage type'
          )
        }

        const { cloudName, apiKey, apiSecret, folder } = config.cloudinary

        if (!cloudName || !apiKey || !apiSecret) {
          throw new Error(
            'Cloudinary cloudName, apiKey, and apiSecret are required'
          )
        }

        return new CloudinaryStorageService(
          cloudName,
          apiKey,
          apiSecret,
          folder
        )

      default:
        console.warn(
          `Unknown storage type: ${storageType}. Falling back to local storage.`
        )
        return new FileStorageService(config.local?.storagePath)
    }
  }

  /**
   * Create storage service from environment variables
   * @returns IFileStorageService implementation
   */
  static createFromEnvironment(): IFileStorageService {
    const storageType = (process.env.STORAGE_TYPE || 'local') as
      | 'local'
      | 'cloudinary'

    const config: StorageConfig = {
      local: {
        storagePath: process.env.LOCAL_STORAGE_PATH || './uploads'
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        folder: process.env.CLOUDINARY_FOLDER || 'uploads'
      }
    }

    return this.createStorageService(storageType, config)
  }

  /**
   * Validate storage configuration
   * @param storageType - Type of storage
   * @param config - Configuration object
   * @returns boolean indicating if configuration is valid
   */
  static validateConfig(
    storageType: 'local' | 'cloudinary',
    config: StorageConfig
  ): boolean {
    switch (storageType.toLowerCase()) {
      case 'local':
        // Local storage always valid (uses default path if not provided)
        return true

      case 'cloudinary':
        if (!config.cloudinary) {
          return false
        }

        const { cloudName, apiKey, apiSecret } = config.cloudinary
        return !!(cloudName && apiKey && apiSecret)

      default:
        return false
    }
  }

  /**
   * Get available storage types
   * @returns Array of available storage types
   */
  static getAvailableStorageTypes(): ('local' | 'cloudinary')[] {
    return ['local', 'cloudinary']
  }

  /**
   * Get storage type from environment
   * @returns Current storage type from environment
   */
  static getStorageTypeFromEnvironment(): 'local' | 'cloudinary' {
    return (process.env.STORAGE_TYPE || 'local') as 'local' | 'cloudinary'
  }
}

/**
 * Storage configuration interfaces
 */
export interface StorageConfig {
  local?: {
    storagePath?: string
  }
  cloudinary?: {
    cloudName: string
    apiKey: string
    apiSecret: string
    folder?: string
  }
}

/**
 * Storage service configuration validator
 */
export class StorageConfigValidator {
  /**
   * Validate environment variables for storage configuration
   * @returns Validation result with errors if any
   */
  static validateEnvironment(): StorageValidationResult {
    const storageType = process.env.STORAGE_TYPE || 'local'
    const errors: string[] = []
    const warnings: string[] = []

    if (storageType === 'cloudinary') {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        errors.push('CLOUDINARY_CLOUD_NAME is required for Cloudinary storage')
      }
      if (!process.env.CLOUDINARY_API_KEY) {
        errors.push('CLOUDINARY_API_KEY is required for Cloudinary storage')
      }
      if (!process.env.CLOUDINARY_API_SECRET) {
        errors.push('CLOUDINARY_API_SECRET is required for Cloudinary storage')
      }
      if (!process.env.CLOUDINARY_FOLDER) {
        warnings.push(
          'CLOUDINARY_FOLDER not set, using default "uploads" folder'
        )
      }
    } else if (storageType === 'local') {
      if (!process.env.LOCAL_STORAGE_PATH) {
        warnings.push(
          'LOCAL_STORAGE_PATH not set, using default "./uploads" directory'
        )
      }
    } else {
      warnings.push(
        `Unknown STORAGE_TYPE: ${storageType}, falling back to local storage`
      )
    }

    return {
      isValid: errors.length === 0,
      storageType: storageType as 'local' | 'cloudinary',
      errors,
      warnings
    }
  }

  /**
   * Get configuration summary
   * @returns Configuration summary string
   */
  static getConfigSummary(): string {
    const validation = this.validateEnvironment()
    const storageType = validation.storageType

    let summary = `📁 Storage Configuration:\n`
    summary += `   Type: ${storageType.toUpperCase()}\n`

    if (storageType === 'local') {
      const path = process.env.LOCAL_STORAGE_PATH || './uploads'
      summary += `   Path: ${path}\n`
    } else if (storageType === 'cloudinary') {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'NOT_SET'
      const folder = process.env.CLOUDINARY_FOLDER || 'uploads'
      summary += `   Cloud Name: ${cloudName}\n`
      summary += `   Folder: ${folder}\n`
    }

    if (validation.warnings.length > 0) {
      summary += `   Warnings: ${validation.warnings.length}\n`
    }

    if (validation.errors.length > 0) {
      summary += `   Errors: ${validation.errors.length}\n`
    }

    return summary
  }
}

/**
 * Storage validation result interface
 */
export interface StorageValidationResult {
  isValid: boolean
  storageType: 'local' | 'cloudinary'
  errors: string[]
  warnings: string[]
}
