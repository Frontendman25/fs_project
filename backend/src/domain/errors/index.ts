/**
 * Domain Errors - Barrel Export
 * Following Clean Architecture - Domain layer
 * Central export point for all error classes
 */

// Base error and common errors
export * from './app.error'

// Database-specific errors
export * from './database.errors'
