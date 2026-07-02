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
FROM oven/bun:slim

WORKDIR /app

# Runtime dependencies for yt-dlp (ffmpeg for merge, python3 for some extractors)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /tmp/yt-dlp /usr/local/bin/yt-dlp
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE ${PORT}

CMD ["bun", "run", ".output/server/index.mjs"]
