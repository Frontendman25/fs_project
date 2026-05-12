# FS Project

> **Work in progress** — portfolio-style codebase; APIs and behaviour may still shift.

**Status:** Active development · Express + Next.js · type-check and tests in `package.json` scripts

## Quick links

- [Live Demo](https://fsprojectfrontend.vercel.app/)
- [API Docs (Swagger)](https://fs-project-backend-0aod.onrender.com/api-docs)

Production: frontend on Vercel, API on Render.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E699)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

> **Note for reviewers:** if the API is hosted on Render’s free/spin-down tier, the first request after idle time can take roughly **30–50 seconds** while the service wakes up. Refresh once if health or Swagger looks slow.

> To reduce how often the free tier spins down, an **external cron** (for example [cron-job.org](https://cron-job.org)) can call `GET /health` on your deployed API on a schedule (for example every ~10 minutes). That does not guarantee zero cold starts, but it usually shortens reviewer wait times.

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

   App URL: **http://localhost:3000** — set `NEXT_PUBLIC_API_URL` for the **frontend** (see [`frontend/.env.example`](./frontend/.env.example) or root `.env` when using Docker Compose).

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
