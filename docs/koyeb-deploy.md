# Koyeb Deployment (Neon PostgreSQL)

This project is deployable to Koyeb as two services:

- `backend` (Dockerfile in `backend/`)
- `frontend` (Dockerfile in `frontend/`)

## 1) Prerequisites

- Neon project + connection string.
- Git repository with this project.
- Koyeb account connected to the repository.

## 2) Backend service on Koyeb

Create a **Web Service** from `backend/` with Docker build.

Set environment variables:

- `NODE_ENV=production`
- `DATABASE_TYPE=postgresql`
- `BACKEND_POSTGRESQL_URL=<your neon connection string>`
- `JWT_SECRET=<strong random value>`
- `REFRESH_TOKEN_SECRET=<strong random value>`
- `SESSION_SECRET=<strong random value>`
- `FRONTEND_URL=<your frontend koyeb URL>`
- `PORT=3100`
- `LOG_LEVEL=info`

Notes:

- Startup runs `prisma migrate deploy` automatically in production.
- `BACKEND_POSTGRESQL_URL` is mapped to runtime `POSTGRESQL_URL` by `backend/scripts/start.sh`.

## 3) Frontend service on Koyeb

Create a second **Web Service** from `frontend/` with Docker build.

Build-time environment variable:

- `NEXT_PUBLIC_API_URL=<your backend koyeb URL>`

Runtime environment variable:

- `NODE_ENV=production`

## 4) CORS and URLs

After frontend is deployed, update backend variable:

- `FRONTEND_URL=<exact frontend URL>`

Then redeploy backend.

## 5) Verification

- Backend health: `GET /health` returns `200`.
- Frontend opens and can call backend API.

## 6) Troubleshooting

- `P1001` on Koyeb: verify Neon URL and credentials.
- 4xx/5xx from browser only: check `FRONTEND_URL` and CORS.
- Migration failures: ensure Neon user has permissions on target database/schema.
