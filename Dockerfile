# syntax=docker/dockerfile:1

# Debian slim + OpenSSL for Prisma (PostgreSQL client)
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# RUN npx prisma db push

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Install fonts system-wide so sharp/librsvg shapes Arabic text when rendering
# certificates on this slim image (embedded @font-face is not honored here).
# fonts-hosny-amiri = the Amiri family (matches font-family:'Amiri'); the manual
# copy of the app's own TTFs is a belt-and-suspenders for weight resolution.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-hosny-amiri \
  && mkdir -p /usr/share/fonts/truetype/perplexity \
  && cp /app/public/fonts/*.ttf /usr/share/fonts/truetype/perplexity/ \
  && fc-cache -f \
  && rm -rf /var/lib/apt/lists/*

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
