import { Router } from 'express'

import { transcriptDebugController } from '@/presentation/controllers/transcript-debug.controller'

export function createTranscriptDebugRoutes(): Router {
  const router = Router()

  router.post('/debug/transcript', transcriptDebugController.probe)

  return router
}
