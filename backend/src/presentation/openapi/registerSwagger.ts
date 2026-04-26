import type { Express, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { parse as parseYaml } from 'yaml'
import swaggerUi from 'swagger-ui-express'

import { logger } from '@/infrastructure/utils/logger'

/**
 * Mounts OpenAPI 3 spec + Swagger UI. Spec file lives in `backend/openapi/openapi.yaml`.
 * Raw JSON: `GET /openapi.json`, UI: `GET /api-docs`.
 */
export function registerOpenApiDocs(app: Express): void {
  const specPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'openapi',
    'openapi.yaml'
  )

  if (!fs.existsSync(specPath)) {
    logger.warn({ specPath }, 'OpenAPI file missing; skip Swagger')
    return
  }

  const raw = fs.readFileSync(specPath, 'utf8')
  const spec = parseYaml(raw) as Record<string, unknown>

  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(spec)
  })

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, { customSiteTitle: 'FS Project API' })
  )

  if (process.env.NODE_ENV !== 'test') {
    logger.info('OpenAPI: /api-docs and /openapi.json')
  }
}
