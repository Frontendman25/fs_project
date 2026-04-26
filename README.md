# FS Project

Full-stack application: a **Next.js** frontend and an **Express** backend organized with **Clean Architecture** (domain, application, infrastructure, presentation). Authentication, posts, file uploads, and real-time chat (Socket.IO + optional Redis) are first-class concerns.

## Repository layout

| Path | Role |
|------|------|
| [`backend/`](./backend/) | REST API, WebSockets, Prisma (PostgreSQL or MongoDB), optional Redis |
| [`frontend/`](./frontend/) | Next.js App Router UI, Redux Toolkit, React Query, next-intl |
| [`docs/`](./docs/) | Additional project documentation (if present) |
| [`DOCUMENTATION_PATTERNS_AND_ALGORITHMS.md`](./DOCUMENTATION_PATTERNS_AND_ALGORITHMS.md) | Design patterns, data structures, and algorithms used across the codebase |
| [`LICENSE`](./LICENSE) | MIT License |

## Prerequisites

- **Node.js** — see [`.nvmrc`](./.nvmrc) for the recommended version
- **Docker** (optional) — for PostgreSQL, MongoDB, Redis, and containerized dev

## Quick start (local)

1. Copy the environment template and adjust values:

   ```bash
   cp .env.example .env
   ```

2. **Backend** — from `backend/`:

   ```bash
   cd backend
   npm install
   npm run db:generate
   npm run dev
   ```

   Default API port: **3100** (overridable via `PORT` in `.env`).

3. **Frontend** — from `frontend/`:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   App URL: **http://localhost:3000** — point `NEXT_PUBLIC_API_URL` in `.env` at the backend (see root `.env.example`).

## Docker (development)

Bring up databases and apps with hot-reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

See comments in [`docker-compose.dev.yml`](./docker-compose.dev.yml) for behaviour and host port overrides.

## API documentation (OpenAPI)

The backend serves a hand-maintained **OpenAPI 3** spec and **Swagger UI**:

- **Swagger UI:** `GET /api-docs` (e.g. http://localhost:3100/api-docs)
- **Raw spec (JSON):** `GET /openapi.json`

The YAML source lives at [`backend/openapi/openapi.yaml`](./backend/openapi/openapi.yaml). It is a concise contract for health, auth, posts, and chat routes — extend it when you add endpoints.

## Architecture (high level)

- **Domain:** entities and repository interfaces only; no framework imports.
- **Application:** use cases coordinate domain and ports.
- **Infrastructure:** Prisma/Mongoose, Redis, storage (local / Cloudinary), Socket.IO — implements domain interfaces.
- **Presentation:** Express routes, middleware, validation, OpenAPI registration.

Database selection is driven by `DATABASE_TYPE` (`postgresql` | `mongodb`). Repository implementations and factories follow the same interfaces so business rules stay stable when storage changes.

## Testing

- **Backend:** `cd backend && npm test` (Vitest; unit / integration / e2e scripts in `backend/package.json`).
- **Frontend:** `cd frontend && npm test` (Vitest + Testing Library; MSW for HTTP in tests).

## Git workflow and commits

This repo is set up for a **Gitflow-style** workflow (long-lived `main`/`master`, feature branches, merge or rebase according to team preference) and **Conventional Commits**.

After `npm install` at the repository root, **Husky** runs the **commitlint** hook on `commit-msg`. Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format, for example:

```text
feat(chat): add room member list
fix(auth): refresh cookie path in production
docs: update API examples in README
```

Types include `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, etc. If the hook reports an error, adjust the message and commit again.

> **Note:** `husky` prints `.git can't be found` during `npm install` if the directory is not a Git repository yet. Initialize Git (`git init`) in the project root so hooks apply to your commits.

## License

Released under the [MIT License](./LICENSE).
