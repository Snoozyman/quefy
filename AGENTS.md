# Commit conventions

- Each commit should contain one logical change
- Write commit messages in the format: `type: short description`
  Types: `feat`, `fix`, `refactor`, `docs`, `ci`, `chore`, `test`
- The description should complete the sentence "This commit will..."
- Bullet points in messages mean the commit is too big — split it
- Avoid "oops" / "fixup" / "wip" commits — amend or rebase instead
- Keep messages under 72 characters for the first line

## Workflow

1. **Create a branch** — `type/descriptive-name` (e.g., `fix/toggleplay-race`, `feat/soundcloud-support`, `docs/standalone-binary`)
2. **Make atomic commits** — one logical change per commit, no bullet points in bodies
3. **Typecheck** — `bun run typecheck` before committing
4. **Push the branch** — `git push -u origin <branch>`
5. **Create a PR** — `gh pr create --base main --head <branch> --title "type: description" --body "what and why"`
6. **Merge** — `gh pr merge <number> --merge --delete-branch`
7. **Clean up** — `git checkout main && git pull origin main`, prune remote branches

- Don't push directly to `main` — always go through a PR
- Test locally before pushing when fixing runtime bugs
- Use `git remote set-url origin https://github.com/Snoozyman/quefy.git` if SSH auth fails

# Project: Quefy

Multi-user YouTube / Spotify / SoundCloud audio streaming rooms.

## Tech stack

- **Framework:** Nuxt 4, Nuxt UI v4, Tailwind CSS v4
- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Lint / format:** ESLint with `@nuxt/eslint` (stylistic rules off) + Prettier (no semicolons, single quotes, no trailing commas — see `.prettierrc`)
- **Test:** Bun test (no Jest/Vitest)
- **PWA:** `@vite-pwa/nuxt`
- **Media:** yt-dlp (YouTube, SoundCloud), Spotify Web Playback SDK / Web API (Spotify), SoundCloud API v2, HLS.js (SoundCloud audio)

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Start dev server (uses `.env.local`) |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint all files (also runs in CI) |
| `bun run format` | Prettier-format all files |
| `bun run typecheck` | Nuxt typecheck (`vue-tsc`) |
| `bun test` | Run all tests |
| `bun run release` | Tag and release (see `scripts/release.sh`) |

## Project structure

```
app/
  components/room/    # PlayerCard (shared now-playing UI) used by AudioPlayer, SpotifyPlayer, NowPlaying; RoomHeader, SongSearch, SongQueue, RoomSettingsTab, SpotifyConnectBanner, CookieUpload, ImportDialog
  composables/        # useRoomState (SSE + polling fallback), useSpotifyAuth, useSpotifyPlayer (singleton module refs)
  pages/app/room/     # [id].vue — room page: wires playback modules to the UI, queue actions
  playback/           # host playback, testable without Nuxt: useRoomPlayback (song change, toggle, skip, track end, refresh), prefetch, spotifyStart, mediaSession, types
  utils/              # song.ts (songSubtitle)
server/
  plugins/            # rooms.ts — load saved rooms at startup, save after changes
  api/                # API endpoints: room/*, spotify/*, youtube/*, soundcloud/*, cookies.*
  utils/              # room.ts, room-events.ts, auth.ts, spotify.ts, youtube.ts, soundcloud.ts, cookies.ts, cookie-fetcher.ts, room-store.ts (rooms.json), data-dir.ts, cookie-refresh.ts (auto-refresh on yt-dlp blocks), yt-dlp.ts (runYtDlp, waitUntilAvailable), yt-dlp-errors.ts, logger.ts
shared/types/         # room.ts, spotify.ts — shared TypeScript types
shared/utils/         # error.ts (errorMessage), urls.ts (media URL validation), format.ts
tests/                # room, room-store, urls, logger, yt-dlp-errors, run-yt-dlp, cookie-refresh, availability; playback/ (client playback with fakes)
```

## Architecture notes

- **Room state** is in memory (`Map<string, Room>`) and saved to `rooms.json` in the data dir (`DATA_DIR`, else the `YT_DLP_COOKIES` folder, else `data/`) by `server/plugins/rooms.ts`, so rooms survive restarts; rooms expire 24h after creation
- **Playback modules** in `app/playback/` take their dependencies as arguments (no auto-imports, no `$fetch`) so `bun test` can drive them with fakes; import shared code via `#shared/*` (resolved by package.json `imports` under Bun)
- **`server/utils/room.ts` owns room state** — endpoints never mutate a `Room` directly; they call `togglePlay`, `skipSong`, `setPosition`, etc., then `emitRoomUpdate`. Clients get `toRoomState(room)` (never the `hostToken`)
- **Realtime** — `GET /api/room/:id/events` is an SSE stream (`room-update`, `room-deleted`). The client polls only while the stream is down. If the host's stream closes for more than 15s, the room is paused
- **Only the host plays audio** — guests see state; the host's browser drives YouTube/SoundCloud (`<audio>`) and Spotify (Web Playback SDK) and reports position every 2s
- **Host auth** — the `hostToken` from room creation (kept in `localStorage['quefy-hosts']`) is sent in the body of host-only endpoints. Server-wide cookie writes need `x-room-id` / `x-host-token` headers for any room's host
- **yt-dlp input** — validate with `shared/utils/urls.ts` and always pass `'--'` before the URL/query argument
- **Queue is hybrid** — songs have a `source` field (`youtube` | `spotify` | `soundcloud`), player switches automatically
- **Spotify search** uses Client Credentials flow (no user auth); **playback** uses Authorization Code flow (Web Playback SDK, Premium required)
- **useSpotifyAuth / useSpotifyPlayer** are module-level singletons so page and all components share the same auth/player state
- **Audio player** is an `<audio>` element in AudioPlayer.vue — handles YouTube direct audio and SoundCloud HLS streams, exposes `play(url)` / `pause()`
- **Cookies** are stored at `data/cookies.txt` (global, single file for all rooms). Uploads are merged by domain + name and verified with yt-dlp. Room creation seeds anonymous cookies only for sites with none
- **Firefox** is detected at Spotify init — shows error message, never loads the SDK
- **Spotify OAuth** — the callback returns tokens in the URL fragment along with `state`, which the client checks against the nonce in `sessionStorage`

## API response format

Endpoints return their data directly (no envelope):

- **Success:** `return data` (e.g. `RoomState`, `SongData`, `{ ok: true }`)
- **Error:** `throw createError({ statusCode, statusMessage, cause })`. `statusMessage` must be safe to show the user; the client reads it with `errorMessage(err)` from `shared/utils/error.ts`

Key response types in `shared/types/`:

| Type | Used by |
|---|---|
| `RoomState` | `GET /api/room/:id` |
| `SongData` | `POST /api/room/:id/queue`, room state arrays |
| `SearchResult` | `GET /api/youtube/search`, `GET /api/spotify/search` |
| `TokenResponse` | `POST /api/spotify/refresh`, OAuth callback |
| `SpotifyPlayerState` | Web Playback SDK state (client-side only) |

## Code style reminders

- Use `err: unknown` in catch blocks, check `err instanceof Error`, preserve `cause` on rethrow
- Prefer Nuxt UI v4 components; `UButtonGroup` removed — use `div.flex.gap-px`
- Use `$fetch` for client-server calls
- Keep `<script setup>` with TypeScript; no Options API
- Use `definePageMeta` sparingly (SSR is disabled for `/app/**`)

## Error handling

Quefy is **self-hosted**, not a public SaaS. Error messages shown to end-users should be descriptive and actionable — the user is also the admin who can fix things.

- **Show the real error** – don't swallow exceptions with empty `catch {}` in user-facing operations. Report what went wrong so the user can diagnose the issue (e.g., check their Spotify account, cookies, or yt-dlp version).
- **Use `error.value`** in composables for UI-visible errors (shown via `UAlert` in the room page).
- **Catch format** – always capture the error object: `catch (err: unknown) { error.value = \`...: ${errorMessage(err)}\` }`. `errorMessage()` (`shared/utils/error.ts`) also unwraps `$fetch` errors' `data.statusMessage`; use `getStderr(err)` for failed child processes.
- **Keep background/supplementary failures silent** – things like `visibilitychange` handlers or fire-and-forget REST calls can swallow errors with `catch(() => {})`.
- **Don't expose secrets** – error messages should never include tokens, passwords, or cookie contents. Request logs redact secret query params (`redactPath` in `server/utils/logger.ts`); add new ones there.
