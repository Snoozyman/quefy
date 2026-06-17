# Docker Guide

Quefy is available as a Docker image for easy deployment.

## Quick Start

### Using Pre-built Images

Pull the latest image from Docker Hub:

```bash
docker pull snoozyman/quefy:latest
```

Run the container:

```bash
docker run -d \
  --name quefy \
  -p 3000:3000 \
  snoozyman/quefy:latest
```

Access the app at `http://localhost:3000`

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  quefy:
    image: snoozyman/quefy:latest
    container_name: quefy
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      # YouTube cookies (optional — can also upload via the room UI)
      # - YT_DLP_COOKIES=/data/cookies.txt
      # Spotify (optional — requires Premium account)
      # - SPOTIFY_CLIENT_ID=
      # - SPOTIFY_CLIENT_SECRET=
      # - SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/spotify/callback
    # volumes:
    #   # Persist uploaded cookies and other data
    #   - ./data:/app/data
    #   # Or mount a cookies file directly (overrides UI upload)
    #   - ./cookies.txt:/data/cookies.txt:ro
```

Start the service:

```bash
docker compose up -d
```

## Building Locally

Build the image from source:

```bash
git clone https://github.com/Snoozyman/quefy.git
cd quefy
docker build -t quefy:local .
docker run -d -p 3000:3000 quefy:local
```

## Image Tags

| Tag      | Description                                  |
| -------- | -------------------------------------------- |
| `latest` | Latest stable release                        |
| `v0.1.0` | Specific version (e.g., v0.1.0, v0.2.0)      |
| `0.1`    | Latest patch for minor version (e.g., 0.1.x) |

## Environment Variables

Pass environment variables using `-e` flag or in `docker-compose.yml`:

```bash
docker run -d \
  -p 3000:3000 \
  -e YT_DLP_COOKIES=/data/cookies.txt \
  -e SPOTIFY_CLIENT_ID=... \
  snoozyman/quefy:latest
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node environment |
| `YT_DLP_COOKIES` | `data/cookies.txt` | Path to cookies file (or upload via room UI) |
| `SPOTIFY_CLIENT_ID` | _(optional)_ | Spotify App Client ID |
| `SPOTIFY_CLIENT_SECRET` | _(optional)_ | Spotify App Client Secret |
| `SPOTIFY_REDIRECT_URI` | `http://localhost:3000/api/spotify/callback` | OAuth redirect URI |
| `SPOTIFY_MARKET` | `US` | Market code for Spotify search results |

## Volume Mounts

### Data Directory (Recommended)

Mount a persistent `data/` directory to preserve uploaded cookies across container restarts:

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  snoozyman/quefy:latest
```

### Cookies File (Optional — legacy method)

Mount a YouTube cookies file directly (alternative to the UI upload):

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/cookies.txt:/data/cookies.txt:ro \
  -e YT_DLP_COOKIES=/data/cookies.txt \
  snoozyman/quefy:latest
```

> **Note:** YouTube cookies expire periodically. If using the UI upload, you can re-upload without restarting the container.

## Production Deployment

### With Reverse Proxy

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name quefy.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### With Traefik

```yaml
services:
  quefy:
    image: snoozyman/quefy:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.quefy.rule=Host(`quefy.example.com`)"
      - "traefik.http.routers.quefy.entrypoints=websecure"
      - "traefik.http.routers.quefy.tls.certresolver=letsencrypt"
      - "traefik.http.services.quefy.loadbalancer.server.port=3000"
```

### Updating

Pull the latest image and recreate the container:

```bash
docker compose pull
docker compose up -d
```

Or for standalone containers:

```bash
docker pull snoozyman/quefy:latest
docker stop quefy && docker rm quefy
docker run -d --name quefy -p 3000:3000 snoozyman/quefy:latest
```

## Troubleshooting

### Container exits immediately

Check logs:

```bash
docker logs quefy
```

### yt-dlp errors

Some videos require authentication. Upload cookies via the room UI, or mount a cookies file — see [Cookies File](#cookies-file-optional) section above.

### Spotify playback fails

- **Firefox** — the Web Playback SDK does not work in Firefox. Use Chrome or Edge.
- **403 / license errors** — the track may not be available in your region. Try setting `SPOTIFY_MARKET` to match your account country.

### Port already in use

Change the host port:

```bash
docker run -d -p 8080:3000 snoozyman/quefy:latest
```

Access at `http://localhost:8080`

## Architecture

- **Base image:** `node:22-bookworm-slim`
- **Build stage:** `oven/bun:latest`
- **Includes:** yt-dlp, ffmpeg, ca-certificates
- **Exposes:** Port 3000

## Source

- GitHub: https://github.com/Snoozyman/quefy
- Docker Hub: https://hub.docker.com/r/snoozyman/quefy
