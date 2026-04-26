/**
 * Loaded before integration/e2e specs (see vitest.config.ts).
 * Ensures `.env.test` is applied so `POSTGRESQL_URL` never points at dev/prod.
 */
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.test') })

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}
