# Quefy

[![CI](https://img.shields.io/github/actions/workflow/status/Snoozyman/quefy/ci.yml?logo=github)](https://github.com/Snoozyman/quefy/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/Snoozyman/quefy/docker-publish.yml?logo=docker)](https://github.com/Snoozyman/quefy/actions/workflows/docker-publish.yml)

<!--
[![License](https://img.shields.io/github/license/Snoozyman/quefy)](LICENSE)
![GitHub Tag](https://img.shields.io/github/v/tag/Snoozyman/quefy)
-->

Multi-user YouTube, Spotify, and SoundCloud audio streaming rooms. Host creates a room,
share the code — joiners queue songs, host's device plays the audio.

Built with [Nuxt](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com),
[yt-dlp](https://github.com/yt-dlp/yt-dlp),
[HLS.js](https://github.com/video-dev/hls.js),
[Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk),
[SoundCloud API v2](https://developers.soundcloud.com).

## Quick Start

```bash
bun install
bun run dev
```

## Test

```bash
bun test
```

## Docker

```bash
docker pull snoozyman/quefy:latest
docker run -d -p 3000:3000 snoozyman/quefy:latest
```

Or build from source:

```bash
docker build -t quefy .
docker run -d -p 3000:3000 quefy
```

See [docs/docker.md](docs/docker.md) for complete Docker documentation including Docker Compose, volume mounts, and production deployment.

## Environment

| Variable                        | Default                                      | Description                                                          |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `PORT`                          | `3000`                                       | HTTP server port                                                     |
| `YT_DLP_PATH`                   | `yt-dlp`                                     | Path to yt-dlp binary                                                |
| `YT_DLP_COOKIES`                | `data/cookies.txt`                           | Path to Netscape cookies file (can also be uploaded via the room UI) |
| `SPOTIFY_CLIENT_ID`             | _(required for Spotify)_                     | Spotify App Client ID                                                |
| `SPOTIFY_CLIENT_SECRET`         | _(required for Spotify)_                     | Spotify App Client Secret                                            |
| `SPOTIFY_REDIRECT_URI`          | `http://127.0.0.1:3000/api/spotify/callback` | OAuth redirect URI (must match Spotify App config)                   |
| `SPOTIFY_MARKET`                | `US`                                         | Market code for Spotify search results (ISO 3166-1 alpha-2)          |

## Cookies (optional)

Some videos and SoundCloud tracks (age-restricted, member-only, private) require
authentication. Cookies are used by yt-dlp for both YouTube and SoundCloud requests.

### Option A: Upload via the room UI

Open a room as host, click the **Cookies** button in the header, then paste or upload
your `cookies.txt` file. Cookies are saved server-side and used immediately.

### Option B: File mount + env var

1. Install a browser extension like **Get cookies.txt LOCALLY** (Chrome/Firefox)
2. Log into YouTube in your browser
3. Export cookies while on `youtube.com` → save as `cookies.txt`
4. Place the file on the server, e.g. `/data/cookies.txt`
5. Set the env var:

```bash
YT_DLP_COOKIES=/data/cookies.txt
```

**Docker:**

```bash
docker run -v /path/on/host/cookies.txt:/data/cookies.txt:ro \
  -e YT_DLP_COOKIES=/data/cookies.txt \
  -p 3000:3000 snoozyman/quefy:latest
```

> [!NOTE]
> YouTube cookies expire periodically. If videos stop working, re-export and upload fresh cookies via the UI or restart the container.

## Spotify (optional)

Play Spotify tracks alongside YouTube in the same queue. Requires a **Spotify Premium** account.

### Setup

1. Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add `http://localhost:3000/api/spotify/callback` as a **Redirect URI** in the app settings
3. Copy the **Client ID** and **Client Secret**
4. Set the environment variables:

```bash
PORT=3000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

5. Restart the dev server and open a room
6. Click **Connect Spotify** in the room header and log in

### How it works

- **Search** uses the Spotify Web API (Client Credentials flow — no user auth needed)
- **Playback** uses the Web Playback SDK (Authorization Code flow — host must log in)
- The queue is hybrid: YouTube, Spotify, and SoundCloud songs play in sequence, the player switches automatically

### Limitations

- **Firefox not supported** — the Web Playback SDK does not work in Firefox. Use Chrome or Edge.
- Spotify songs play through the host's browser (similar to YouTube audio)
- Volume and seeking use the Web Playback SDK controls

## Bug Reports

Found a bug? [Open an issue](https://github.com/Snoozyman/quefy/issues/new/choose) with the browser, platform, and steps to reproduce.
