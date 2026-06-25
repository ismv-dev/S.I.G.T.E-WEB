# syntax=docker/dockerfile:1
FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN apt-get update \
  && apt-get install -y python3 build-essential --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:22-slim AS runner

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --production --frozen-lockfile --ignore-scripts

COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/next.config.ts ./next.config.ts
COPY --from=builder /usr/src/app/.env.example ./.env.example

EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]
