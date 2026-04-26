import type { ILoggerService } from '@/domain/services/logger.service'

/**
 * Refuses to seed a production database unless the operator opts in
 * explicitly via `ALLOW_PROD_SEED=true`.
 *
 * Throwing instead of `process.exit` so callers decide how to surface
 * the failure (logs, metrics, non-zero exit).
 */
export function assertSeedAllowed(logger: ILoggerService): void {
  const env = process.env.NODE_ENV ?? 'development'
  const allowProdSeed = process.env.ALLOW_PROD_SEED === 'true'

  if (env === 'production' && !allowProdSeed) {
    logger.error(
      { env },
      'Refusing to seed in production. Set ALLOW_PROD_SEED=true to override.'
    )
    throw new Error(
      'Seeding is disabled in production. Re-run with ALLOW_PROD_SEED=true if intentional.'
    )
  }

  if (env === 'production') {
    logger.warn(
      { env },
      'Running seeder against a production environment (ALLOW_PROD_SEED=true).'
    )
  }
}
