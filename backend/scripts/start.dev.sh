#!/bin/sh
set -e

# Run Prisma migrations only when using PostgreSQL.
# In development 'migrate deploy' is used (not 'migrate dev') so the container
# does not prompt for migration names.
if [ "$DATABASE_TYPE" = "postgresql" ]; then
  echo "[startup] Running Prisma migrations (dev)..."
  npx prisma migrate deploy
  echo "[startup] Migrations complete."
fi

echo "[startup] Starting backend (development)..."
exec npm run dev
