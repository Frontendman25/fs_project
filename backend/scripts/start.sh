#!/bin/sh
set -e

# Prisma reads POSTGRESQL_URL from prisma/schema.prisma. Hosts (Render, Neon)
# often expose DATABASE_URL only — map known aliases before migrate/deploy.
if [ -z "${POSTGRESQL_URL:-}" ]; then
  if [ -n "${BACKEND_POSTGRESQL_URL:-}" ]; then
    export POSTGRESQL_URL="$BACKEND_POSTGRESQL_URL"
  elif [ -n "${DATABASE_URL:-}" ]; then
    export POSTGRESQL_URL="$DATABASE_URL"
  fi
fi

# Run Prisma migrations only when using PostgreSQL.
# In production the 'migrate deploy' command applies pending migrations
# without asking for confirmation (safe for automated environments).
if [ "$DATABASE_TYPE" = "postgresql" ]; then
  echo "[startup] Running Prisma migrations..."
  npx prisma migrate deploy
  echo "[startup] Migrations complete."
fi

echo "[startup] Starting backend (production)..."
exec node dist/index.js
