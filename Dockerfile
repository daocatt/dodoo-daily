# syntax=docker/dockerfile:1
# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ⚡ 从非当前目录(通过 Docker BuildKit secret)挂载 .env 文件
# 在群晖构建时，系统会读取外部的 .env，并在构建阶段应用(如 NEXT_PUBLIC_ 变量)
RUN --mount=type=secret,id=ext_env \
    if [ -f /run/secrets/ext_env ]; then cat /run/secrets/ext_env > .env; fi && \
    npm run build

# ============================================================
# Stage 2: Runner (minimal production image)
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# --- Static assets & public files ---
COPY --from=builder /app/public ./public

# --- Migration script & startup ---
COPY --from=builder /app/migrate.js ./
COPY --from=builder /app/start.sh   ./

# Migration SQL files (copied from drizzle output dir)
COPY --from=builder /app/src/lib/drizzle ./drizzle

# --- Next.js standalone bundle ---
RUN mkdir -p .next \
 && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# --- Persistent data directories ---
# These will be mounted as volumes; create them here so they exist with correct perms
RUN mkdir -p database uploads/images uploads/voices uploads/avatars \
 && chown -R nextjs:nodejs database uploads

RUN chmod +x start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./start.sh"]
