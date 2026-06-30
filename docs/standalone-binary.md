# Standalone Binary Design

Single executable packaging Quefy server + client into one self-contained binary. Distributed via GitHub Releases.

## Architecture

```
quefy-v0.2.0-linux-x64.tar.gz  (release artifact)
├── quefy              ← the compiled binary (~100 MB)
├── yt-dlp             ← standalone binary (~15 MB)
├── ffmpeg             ← static build (~40 MB)
└── curl               ← static build (~5 MB)
```

The binary (`quefy`) is a Bun-compiled executable. At startup it:

1. Extracts `.output/public/` (embedded as base64 tar) to a temp directory
2. Resolves `yt-dlp`, `ffmpeg`, `curl` relative to its own directory, then falls back to `PATH`
3. Starts the Nitro HTTP server on `PORT` (default 3000)
4. Opens the default browser to `http://localhost:{PORT}`
5. Accepts `SIGINT`/`SIGTERM` for clean shutdown (cleans temp dir, stops server)

## Components

### `scripts/compile.ts`

Build script for developers and CI. Run after `bun run build` (which produces `.output/`):

```
bun run build           # produces .output/server/ + .output/public/
bun run scripts/compile.ts   # produces dist/ directory
```

What it does:

1. **Embed public assets** — tar+gz `.output/public/`, base64-encode, write as a string literal into a generated entry file
2. **Generate entry point** (`dist/entry.tmp.ts`) that:
   - Imports `.output/server/index.mjs` (the Nitro server)
   - Extracts `public/` to `os.tmpdir()` on first run
   - Configures Nitro to serve static files from the extracted path
   - Resolves external tool paths
   - Starts server, logs URL, opens browser
3. **Compile binary** — `bun build --compile --minify dist/entry.tmp.ts --outfile dist/quefy`
4. **Copy runtime deps** — copies `yt-dlp`, `ffmpeg`, `curl` into `dist/`
5. **Pack release** — `tar -czf dist/quefy-vX.Y.Z-{platform}.tar.gz dist/quefy dist/yt-dlp dist/ffmpeg dist/curl`

### `scripts/entry.ts.template`

The entry point logic for the compiled binary:

```ts
import server from '../.output/server/index.mjs'
import { execSync } from 'node:child_process'
import { createWriteStream, mkdirSync, existsSync, chmodSync, writeFileSync } from 'node:fs'
import { tmpdir, platform, arch } from 'node:os'
import { join, dirname } from 'node:path'
import { gunzipSync } from 'node:zlib'

// ── 1. Extract embedded public/ ──────────────────────────────────
const PUBLIC_TARBALL_BASE64 = '...' // injected by compile.ts
const EXTRACT_DIR = join(tmpdir(), 'quefy-public')

if (!existsSync(EXTRACT_DIR)) {
  mkdirSync(EXTRACT_DIR, { recursive: true })
  const tarball = Buffer.from(PUBLIC_TARBALL_BASE64, 'base64')
  execSync(`tar -xzf - -C "${EXTRACT_DIR}"`, { input: tarball })
}

// ── 2. Resolve external tools ────────────────────────────────────
const BIN_DIR = dirname(process.execPath)

function resolveTool(name: string): string {
  const envKey = name === 'yt-dlp' ? 'YT_DLP_PATH' : undefined
  if (envKey && process.env[envKey]) return process.env[envKey]!

  const local = join(BIN_DIR, name)
  if (existsSync(local)) return local

  const which = (() => {
    try { return execSync(`which ${name}`, { encoding: 'utf-8' }).trim() }
    catch { return '' }
  })()
  if (which) return which

  console.error(`${name} not found. Place it next to the quefy binary or install it.`)
  process.exit(1)
}

process.env.YT_DLP_PATH = resolveTool('yt-dlp')
process.env.FFMPEG_PATH  = resolveTool('ffmpeg')
// curl is called via execSync('curl ...') directly in cookie-fetcher.ts

// ── 3. Configure Nitro static serving ────────────────────────────
// Override Nitro's public asset dir to the extracted temp directory
process.env.NITRO_PUBLIC_DIR = EXTRACT_DIR

// ── 4. Set port ──────────────────────────────────────────────────
const PORT = process.env.PORT || '3000'

// ── 5. Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`Quefy ready at ${url}`)

  // Open browser
  const cmd = platform() === 'darwin' ? 'open'
    : platform() === 'win32' ? 'start'
    : 'xdg-open'
  execSync(`${cmd} ${url}`, { stdio: 'ignore' }).catch(() => {})

  // ── Cleanup on exit ────────────────────────────────────────────
  const cleanup = () => {
    try { execSync(`rm -rf "${EXTRACT_DIR}"`) } catch {}
    process.exit()
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
})
```

### Runtime environment variables

All existing env vars work (passed through to the Nitro process):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `YT_DLP_PATH` | auto | Override yt-dlp path |
| `YT_DLP_COOKIES` | auto | Path to cookies file |
| `SPOTIFY_CLIENT_ID` | — | Spotify App Client ID |
| `SPOTIFY_CLIENT_SECRET` | — | Spotify App Client Secret |
| `SPOTIFY_REDIRECT_URI` | — | OAuth redirect URI |
| `SPOTIFY_MARKET` | `US` | Market code for search |

## GitHub Actions workflow

### `release-binary.yml` (new)

Triggered on tag push (`v*`). Runs in parallel with the existing Docker publish:

```yaml
name: release-binary

on:
  push:
    tags: ["v*"]

jobs:
  binary:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: linux-x64
            artifact: quefy-v${{ github.ref_name }}-linux-x64.tar.gz
          - os: macos-latest
            target: darwin-arm64
            artifact: quefy-v${{ github.ref_name }}-darwin-arm64.tar.gz

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v6

      - uses: oven-sh/setup-bun@v2

      - name: Install build deps
        run: bun install --frozen-lockfile

      - name: Build app
        run: bun run build

      - name: Compile binary
        run: bun run scripts/compile.ts

      - name: Download yt-dlp
        run: |
          curl -L -o dist/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
          chmod +x dist/yt-dlp

      - name: Download ffmpeg (Linux)
        if: runner.os == 'Linux'
        run: |
          curl -L -o ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
          tar -xf ffmpeg.tar.xz
          cp ffmpeg-*-static/ffmpeg dist/

      - name: Download ffmpeg (macOS)
        if: runner.os == 'macOS'
        run: brew install ffmpeg && cp $(which ffmpeg) dist/

      - name: Package
        run: tar -czf dist/${{ matrix.artifact }} -C dist quefy yt-dlp ffmpeg

      - name: Upload to release
        uses: softprops/action-gh-release@v2
        with:
          files: dist/${{ matrix.artifact }}
```

### Update existing `release.yml`

Add the binary artifacts to the existing release workflow output:

No change needed — `softprops/action-gh-release@v2` is already used. The `release-binary.yml` workflow runs in parallel and uploads to the same release tag.

## package.json additions

```json
{
  "scripts": {
    "compile": "bun run scripts/compile.ts"
  }
}
```

## Size estimates

| Component | Linux x64 | macOS arm64 |
|---|---|---|
| Bun runtime (embedded) | ~55 MB | ~50 MB |
| App code (compiled) | ~15 MB | ~12 MB |
| `.output/public/` (embedded) | ~3 MB | ~3 MB |
| yt-dlp (standalone) | ~15 MB | ~15 MB |
| ffmpeg (static) | ~40 MB | ~80 MB* |
| **Total .tar.gz** | **~80 MB** | **~100 MB** |

*ffmpeg on macOS via Homebrew is larger. Could use a static build instead.

## Limitations

- **Native modules** — Bun compile may fail with `sharp` (image processing). If it does, disable image optimization at build time or use `@img/sharp` which is already in the dep tree
- **Platform-specific** — Each binary is tied to its OS/arch. CI matrix covers linux-x64 and darwin-arm64
- **No auto-update** — Users download new binaries from GitHub Releases
- **Spotify SDK** — Still requires a browser. The binary is the server; the client runs in the user's browser
- **Cookie fetching** — Uses `curl` as a subprocess. The static curl binary must be bundled

## Alternative considered: Deno compile

Deno's `deno compile` natively supports embedding assets (`--include`). But the app uses Bun and Nuxt — porting to Deno would be a rewrite.

## Alternative considered: Tauri bundling

Wrap the web app in Tauri (Rust shell + webview). This would bundle Chromium (~120 MB), making the binary huge. And the app is designed as a server, not a local-only desktop app.

## Next steps after implementation

1. Add a download section to README
2. Add OS-specific install instructions (`brew install quefy` after tap, `apt` repo, etc.)
3. Add `.sh` / `.ps1` launcher scripts for easy startup
