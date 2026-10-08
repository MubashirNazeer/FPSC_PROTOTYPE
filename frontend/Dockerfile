# Debian-based Node (more reliable than Alpine for Next standalone on some VMs)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Low-memory / flaky-DNS friendly install (avoid npm ci OOM on small VMs)
COPY package.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set maxsockets 3 \
    && npm install --no-audit --no-fund \
    && test -f node_modules/next/dist/bin/next

COPY . .

ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1536

# Call Next via node — avoids npx (DNS) and fragile .bin shims
RUN node node_modules/next/dist/bin/next build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8888 \
    HOSTNAME=0.0.0.0 \
    API_INTERNAL_URL=http://backend:8000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8888

CMD ["node", "server.js"]
