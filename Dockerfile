# syntax=docker/dockerfile:1
#
# بناء وتشغيل (بدون docker compose):
#   docker build -t school-health .
#   docker run -d --name school-health -p 3000:3000 \
#     -e DATABASE_URL='postgresql://...' \
#     -e AUTH_SECRET='...' \
#     -e AUTH_URL='https://your-domain' \
#     -e APP_TIMEZONE='Asia/Qatar' \
#     -e RUN_DB_PUSH=true \
#     -v school-health-uploads:/app/uploads \
#     --restart unless-stopped \
#     school-health
#
# RUN_DB_PUSH=true مرة واحدة عند أول نشر فقط. البيانات التجريبية: npm run db:seed من جهازك ضد نفس DATABASE_URL.

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# سكربت postinstall يشغّل prisma generate، فيلزم وجود الـ schema قبل npm ci
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma يحتاج DATABASE_URL وقت البناء فقط
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/app/uploads

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma + Argon2 (native) للتشغيل و db push الاختياري
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@node-rs ./node_modules/@node-rs

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p /app/uploads \
  && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
