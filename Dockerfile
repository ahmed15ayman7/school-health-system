# syntax=docker/dockerfile:1
#
# Coolify / docker build -t school-health .
# قبل أول نشر: npm run db:push && npm run db:seed (DATABASE_URL للإنتاج)
# لا تضبط RUN_DB_PUSH في Coolify.

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tini curl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# postinstall = prisma generate — يلزم schema قبل npm ci
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/app/uploads

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/uploads \
  && chown -R nextjs:nodejs /app/uploads

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@node-rs ./node_modules/@node-rs
COPY --from=builder /app/prisma ./prisma

RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-hosny-amiri \
  && if compgen -G "/app/public/fonts/*.ttf" > /dev/null; then \
       mkdir -p /usr/share/fonts/truetype/perplexity \
       && cp /app/public/fonts/*.ttf /usr/share/fonts/truetype/perplexity/; \
     fi \
  && fc-cache -f \
  && rm -rf /var/lib/apt/lists/*

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/v1/health >/dev/null || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
CMD ["node", "server.js"]
