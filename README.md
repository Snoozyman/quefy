# Quefy

[![ci](https://img.shields.io/github/actions/workflow/status/Snoozyman/quefy/ci.yml?branch=master&style=flat-square&label=ci)](https://github.com/Snoozyman/quefy/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/v/Snoozyman/quefy?style=flat-square&label=docker)](https://hub.docker.com/r/Snoozyman/quefy)
[![License](https://img.shields.io/github/license/Snoozyman/quefy?style=flat-square)](LICENSE)

Multi-user YouTube audio streaming rooms. Host creates a room, share the code —
joiners queue songs, host's device plays the audio.

Built with [Nuxt](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com),
[yt-dlp](https://github.com/yt-dlp/yt-dlp).

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
docker build -t quefy .
docker run -p 3000:3000 quefy
```

Images are also published on tag:

```bash
docker pull snoozyman/quefy:v1.0.0
```

## Environment

All variables are optional:

| Variable | Default | Description |
|---|---|---|
| `YT_DLP_PATH` | `yt-dlp` | Path to yt-dlp binary |
| `YT_DLP_COOKIES` | _(none)_ | Path to a Netscape-format cookies file for authenticated requests (age-restricted or member-only videos) |

## Cookies (optional)

Some videos (age-restricted, member-only, private) require YouTube authentication.
To enable access, export your browser cookies to a Netscape-format file and point
`YT_DLP_COOKIES` at it.

1. Install a browser extension like **Get cookies.txt LO** (Chrome/Firefox)
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
> YouTube cookies expire periodically. If videos stop working, re-export and restart
> the container.
