import type { PrismaClient } from '@prisma/client'

/** Tables Prisma manages for migrations — never truncate. */
const DEFAULT_EXCLUDED = new Set<string>(['_prisma_migrations'])

export type TruncateAllTablesOptions = {
  /** PostgreSQL schema (default `public`, matches typical Prisma setup). */
  schema?: string
  /** Extra table names to leave untouched (e.g. seed lookup tables). */
  excludeTables?: Iterable<string>
}

function quotePgIdentifier(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`
}

/**
 * Discovers `BASE TABLE` rows in `information_schema`, then runs one
 * `TRUNCATE … RESTART IDENTITY CASCADE` so FK order stays irrelevant and
 * sequences reset. Stays in sync when `schema.prisma` adds tables.
 */
export async function truncateAllPublicTables(
  prisma: PrismaClient,
  options?: TruncateAllTablesOptions
): Promise<void> {
  const schema = options?.schema ?? 'public'

  await prisma.$connect()

  const rows = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_type = 'BASE TABLE'
  `

  const excluded = new Set(DEFAULT_EXCLUDED)
  if (options?.excludeTables) {
    for (const t of options.excludeTables) {
      excluded.add(t)
    }
  }

  const tables = rows.map((r) => r.table_name).filter((t) => !excluded.has(t))
  if (tables.length === 0) {
    return
  }

  const list = tables.map(quotePgIdentifier).join(', ')
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`
  )
}
