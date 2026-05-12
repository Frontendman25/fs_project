#!/bin/sh
set -e

select_postgresql_url() {
  local neon_url="${BACKEND_POSTGRESQL_URL:-}"
  local local_url="${LOCAL_POSTGRESQL_URL:-postgresql://${POSTGRES_USER:-fs_project}:${POSTGRES_PASSWORD:-change_me}@postgres:5432/${POSTGRES_DB:-fs_project}}"

  if [ -z "$neon_url" ]; then
    echo "[DB] BACKEND_POSTGRESQL_URL is empty, using local PostgreSQL."
    export POSTGRESQL_URL="$local_url"
    return
  fi

  local neon_host
  neon_host="$(node -e "const u=new URL(process.argv[1]); console.log(u.hostname)" "$neon_url")"
  local neon_port
  neon_port="$(node -e "const u=new URL(process.argv[1]); console.log(u.port || '5432')" "$neon_url")"

  if nc -z -w 3 "$neon_host" "$neon_port" >/dev/null 2>&1; then
    echo "[DB] Neon endpoint $neon_host:$neon_port is reachable, using Neon."
    export POSTGRESQL_URL="$neon_url"
  else
    echo "[DB] NEON UNAVAILABLE, FALLING BACK TO LOCAL ($neon_host:$neon_port unreachable)."
    export POSTGRESQL_URL="$local_url"
  fi
}

# Run Prisma migrations only when using PostgreSQL.
# In development 'migrate deploy' is used (not 'migrate dev') so the container
# does not prompt for migration names.
if [ "$DATABASE_TYPE" = "postgresql" ]; then
  select_postgresql_url

  if [ -z "${POSTGRESQL_DIRECT_URL:-}" ]; then
    case "${POSTGRESQL_URL:-}" in
      *-pooler.*)
        export POSTGRESQL_DIRECT_URL="$(printf '%s\n' "$POSTGRESQL_URL" | sed 's/-pooler\././')"
        ;;
    esac
  fi
  if [ -z "${POSTGRESQL_DIRECT_URL:-}" ] && [ -n "${POSTGRESQL_URL:-}" ]; then
    export POSTGRESQL_DIRECT_URL="$POSTGRESQL_URL"
  fi

  echo "[startup] Generating Prisma client..."
  npx prisma generate
  echo "[startup] Prisma client generated."

  echo "[startup] Running Prisma migrations (dev)..."
  npx prisma migrate deploy
  echo "[startup] Migrations complete."
fi

echo "[startup] Starting backend (development)..."
exec npm run dev
