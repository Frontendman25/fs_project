/**
 * 🚀 File Upload & Auth API Server
 *
 * Entry point: loads env, boots the application, listens on PORT (production).
 * For tests, import `setupApplication` from `@/bootstrap/setupApplication` instead.
 */

import dotenv from 'dotenv'

import { setupApplication } from '@/bootstrap/setupApplication'

dotenv.config()

async function main(): Promise<void> {
  const bundle = await setupApplication({ listen: true })

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Graceful shutdown...`)
    try {
      await bundle.shutdown()
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })
}
