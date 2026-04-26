# Frontend

Next.js (App Router) client for **FS Project**: posts, auth, profiles, uploads, and real-time chat backed by the API in `[../backend/](../backend/)`.

## Stack

- **Next.js 15** with **Turbopack** for `dev` / `build`
- **React 19**, **TypeScript**
- **Redux Toolkit** + **TanStack Query** for server/cache state where appropriate
- **next-intl** for i18n, **next-themes** for dark/light
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Socket.IO client** for chat events
- **Vitest** + **Testing Library** + **MSW** for tests

## Configuration

Copy the root `[.env.example](../.env.example)` to `.env` in the **repository root** (or set variables in your shell). The frontend reads:

- `**NEXT_PUBLIC_API_URL`** — base URL of the backend (default in example: `http://localhost:3100`).
- `**FRONTEND_URL**` — used by the backend for CORS and redirects (default: `http://localhost:3000`).

Never commit real secrets; keep them in `.env` (ignored by Git).

## Local development

From this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure the backend is running and `NEXT_PUBLIC_API_URL` points to it.

## Production build

```bash
npm run build
npm start
```

## Testing

Vitest and React Testing Library cover unit and integration-style UI tests.

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Test layout

- Global setup: `src/tests/setup.ts`
- MSW server: `src/tests/mocks/server.ts`; default handlers in `src/tests/mocks/handlers`
- Per-test overrides: `server.use(...)`
- Redux-aware helpers: `src/tests/utils/render.tsx`
- Shared fixtures: `src/tests/fixtures`

### Conventions

- Prefer accessible queries (`getByRole`, `findByRole`, `findBy*` for async updates).
- Use stable `data-testid` only when role/label queries are not practical.
- Avoid asserting on raw translation strings; assert behaviour and UI state.
- Structure tests as: arrange, act, assert.

## API and API docs

REST and WebSocket behaviour are implemented in the backend. Human-readable OpenAPI + Swagger UI are available at `{API_BASE}/api-docs` (see the [root README](../README.md) and `NEXT_PUBLIC_API_URL`).