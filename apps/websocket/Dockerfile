FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/websocket/package.json ./apps/websocket/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.pnpm ./.pnpm
COPY . .
RUN pnpm build --filter=@saas/websocket

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/websocket/dist ./apps/websocket/dist
COPY --from=build /app/packages/*/dist ./packages/
COPY --from=build /app/apps/websocket/package.json ./apps/websocket/

EXPOSE 3001
CMD ["node", "apps/websocket/dist/main.js"]