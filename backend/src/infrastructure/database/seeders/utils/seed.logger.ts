import type { ILoggerService } from '@/domain/services/logger.service'

import type { SeedModuleResult } from '../seed.types'

/**
 * Thin structured progress reporter. Uses the project logger so output goes
 * through the same pino pipeline as the rest of the app.
 */
export class SeedProgressReporter {
  constructor(private readonly logger: ILoggerService) {}

  stepStart(step: string, engine: string): void {
    this.logger.info({ step, engine, phase: 'start' }, `▶ ${engine}:${step}`)
  }

  stepEnd(result: SeedModuleResult): void {
    this.logger.info(
      {
        step: result.name,
        engine: result.engine,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        durationMs: result.durationMs,
        phase: 'end'
      },
      `✓ ${result.engine}:${result.name} (+${result.created} ~${result.updated} =${result.skipped} in ${result.durationMs}ms)`
    )
  }

  stepFailure(step: string, engine: string, error: unknown): void {
    const { message, hint } = describeError(error)
    this.logger.error(
      { step, engine, error: message, hint, phase: 'failed' },
      `✗ ${engine}:${step} failed — ${message}`
    )
  }

  summary(results: readonly SeedModuleResult[]): void {
    const totals = results.reduce(
      (acc, r) => ({
        created: acc.created + r.created,
        updated: acc.updated + r.updated,
        skipped: acc.skipped + r.skipped,
        durationMs: acc.durationMs + r.durationMs
      }),
      { created: 0, updated: 0, skipped: 0, durationMs: 0 }
    )
    this.logger.info(
      { totals, modules: results.length },
      `✓ seed complete: ${totals.created} created, ${totals.updated} updated, ${totals.skipped} skipped (${totals.durationMs}ms)`
    )
  }
}

/**
 * Translate common infra errors into actionable hints so the operator
 * knows what to do (check connection string, missing migration, etc).
 */
export function describeError(error: unknown): {
  message: string
  hint?: string
} {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }
  const message = error.message

  if (/ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(message)) {
    return {
      message,
      hint: 'Database is unreachable. Verify POSTGRESQL_URL / MONGODB_URI and that the containers/services are running.'
    }
  }
  if (/P1001|P1002/i.test(message)) {
    return {
      message,
      hint: 'Prisma cannot reach Postgres. Check POSTGRESQL_URL and that `npx prisma migrate deploy` has been run.'
    }
  }
  if (/P2021|does not exist in the current database/i.test(message)) {
    return {
      message,
      hint: 'Postgres schema is missing. Run `npm run db:migrate` (dev) or `npm run db:migrate:deploy` (prod) first.'
    }
  }
  if (/P2002|Unique constraint/i.test(message)) {
    return {
      message,
      hint: 'Unique constraint violated. Seeder uses deterministic ids — ensure you did not mix runs with SEED_RANDOM=true and without.'
    }
  }
  if (/MongoServerSelectionError|Authentication failed/i.test(message)) {
    return {
      message,
      hint: 'Mongo auth/connection failed. Verify MONGODB_URI and network access (VPN, IP allowlist).'
    }
  }
  return { message }
}
