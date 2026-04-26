#!/bin/sh
set -e

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
