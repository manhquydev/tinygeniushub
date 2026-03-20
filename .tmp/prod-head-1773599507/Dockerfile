FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client curl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chmod +x ./scripts/start-web.sh ./scripts/start-worker.sh

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
