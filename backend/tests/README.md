# Backend tests

| Folder        | Purpose |
|---------------|---------|
| `tests/unit`   | Fast tests with mocks (no real DB). |
| `tests/integration` | Real PostgreSQL + real repositories (no HTTP). |
| `tests/e2e`    | Supertest against Express app (`listen: false`). |

## Environment

1. Copy `.env.test.example` → `.env.test`.
2. Set `POSTGRESQL_URL` to a **dedicated test database** (never dev/prod).
3. Apply schema: `POSTGRESQL_URL=... npx prisma migrate deploy` (or `db push` for throwaway DBs).

Integration/E2E suites use `describe.skipIf` when `POSTGRESQL_URL` / JWT secrets are missing, so `npm test` still passes in CI without Docker.

## Docker test DB

```bash
docker compose -f docker-compose.test.yml up -d
# POSTGRESQL_URL=postgresql://postgres:postgres@localhost:5433/fs_backend_test
npx prisma migrate deploy
npm test
```

## Helpers

- `tests/helpers/db.ts` — re-exports `truncateAllTables` (dynamic PostgreSQL `TRUNCATE … RESTART IDENTITY CASCADE` via `information_schema`) and `cleanDatabase` (Mongoose parallel `deleteMany`).
- `tests/helpers/postgres.truncate.ts`, `tests/helpers/mongoose.clean-database.ts` — implementations.
- `tests/helpers/factories.ts` — `createUserRecord` (bcrypt password).
- `tests/setup/loadEnv.ts` — loads `.env.test` before tests.
