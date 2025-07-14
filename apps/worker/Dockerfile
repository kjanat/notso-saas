FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.pnpm ./.pnpm
COPY . .
RUN pnpm build --filter=@saas/worker

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/apps/worker/package.json ./apps/worker/

CMD ["node", "apps/worker/dist/main.js"]