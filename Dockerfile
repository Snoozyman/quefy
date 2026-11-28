# ---- Build stage ----
FROM oven/bun:latest AS build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
  -o /tmp/yt-dlp && chmod +x /tmp/yt-dlp

RUN bun run build

# ---- Production stage ----
FROM node:22-bookworm-slim

WORKDIR /app

# Runtime dependencies for yt-dlp (ffmpeg for merge, python3 for some extractors)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /tmp/yt-dlp /usr/local/bin/yt-dlp
COPY --from=build /usr/local/bin/bun /usr/local/bin/bun
COPY --from=build /app/.output ./.output
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
# The app runs as PUID:PGID (see docker/entrypoint.sh); yt-dlp keeps its
# cache under HOME.
ENV HOME=/app/home
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
