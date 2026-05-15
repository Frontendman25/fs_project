#!/bin/sh
set -e

# DATABASE_TARGET controls which Postgres URL the dev container uses:
#   local  — always LOCAL_POSTGRESQL_URL (Docker service "postgres")
#   neon   — always BACKEND_POSTGRESQL_URL (Neon / managed prod DB)
#   auto   — Neon if reachable from container, else local (legacy behaviour)
select_postgresql_url() {
  local neon_url="${BACKEND_POSTGRESQL_URL:-}"
  local local_url="${LOCAL_POSTGRESQL_URL:-postgresql://${POSTGRES_USER:-fs_project}:${POSTGRES_PASSWORD:-change_me}@postgres:5432/${POSTGRES_DB:-fs_project}}"
  local target="${DATABASE_TARGET:-local}"

  case "$target" in
    local)
      echo "[DB] DATABASE_TARGET=local — using local PostgreSQL ($local_url)."
      export POSTGRESQL_URL="$local_url"
      return
      ;;
    neon)
      if [ -z "$neon_url" ]; then
        echo "[DB] ERROR: DATABASE_TARGET=neon but BACKEND_POSTGRESQL_URL is empty." >&2
        exit 1
      fi
      echo "[DB] DATABASE_TARGET=neon — using BACKEND_POSTGRESQL_URL."
      export POSTGRESQL_URL="$neon_url"
      return
      ;;
    auto)
      ;;
    *)
      echo "[DB] WARNING: unknown DATABASE_TARGET=$target, treating as local." >&2
      export POSTGRESQL_URL="$local_url"
      return
      ;;
  esac

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
    echo "[DB] DATABASE_TARGET=auto — Neon $neon_host:$neon_port reachable, using Neon."
    export POSTGRESQL_URL="$neon_url"
  else
    echo "[DB] DATABASE_TARGET=auto — Neon unreachable, using local PostgreSQL."
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
