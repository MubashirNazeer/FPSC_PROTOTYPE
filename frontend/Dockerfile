# Debian-based Node (more reliable than Alpine for Next standalone on some VMs)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1

# Use local binary — avoid `npx` (it hits registry.npmjs.org and fails on flaky DNS)
RUN ./node_modules/.bin/next build

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
