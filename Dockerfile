FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.24.0

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client curl
RUN addgroup -S app -g 10001 && adduser -S -D -H -u 10001 -G app app
RUN mkdir -p /home/app/.cache/node/corepack /app/.next && chown -R app:app /home/app && chown app:app /app /app/.next

COPY --chown=app:app --from=deps /app/node_modules ./node_modules
COPY --chown=app:app . .

RUN pnpm db:generate
RUN chmod +x ./scripts/start-web.sh ./scripts/start-worker.sh

ENV HOME="/home/app"
ENV XDG_CACHE_HOME="/home/app/.cache"

USER app

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
