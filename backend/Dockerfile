# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — dependencies
# Install all npm packages (including devDeps needed for build and testing).
# This layer is cached as long as package-lock.json does not change.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Compile TypeScript → JavaScript and resolve path aliases via tsc-alias.
# Also generates the Prisma client so it is baked into dist/.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before compiling so the generated types are available.
RUN npx prisma generate

# tsc outputs to dist/, tsc-alias rewrites @/* path aliases to relative paths.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — development
# Runs the app with ts-node / nodemon for hot-reload.
# Source code is bind-mounted at runtime (see docker-compose.dev.yml).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app

ENV NODE_ENV=development

# Non-root user for consistency with production.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser
EXPOSE 3100

CMD ["sh", "./scripts/start.dev.sh"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4 — production
# Lean image: only production npm deps + compiled dist/ + prisma schema.
# Runs as non-root user.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Non-root user — created before copying files so chown works cheaply.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install production dependencies only.
# tsc-alias and other devDeps are NOT included.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma CLI is in dependencies (moved from devDeps) so 'migrate deploy' works.
# Copy the generated client artefact that was built in the builder stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled application.
COPY --from=builder /app/dist ./dist

# Prisma schema is required at runtime by 'prisma migrate deploy'.
COPY --from=builder /app/prisma ./prisma

# Startup script.
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Persistent upload directory (bind-mounted via named volume in docker-compose).
RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser
EXPOSE 3100

CMD ["sh", "./scripts/start.sh"]
