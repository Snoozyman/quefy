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
- **Lint:** ESLint with `@nuxt/eslint` (stylistic: comma-dangle never, brace 1tbs)
- **Test:** Bun test (no Jest/Vitest)
- **PWA:** `@vite-pwa/nuxt`
- **Media:** yt-dlp (YouTube, SoundCloud), Spotify Web Playback SDK / Web API (Spotify), SoundCloud API v2, HLS.js (SoundCloud audio)

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Start dev server (uses `.env.local`) |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint all files |
| `bun run typecheck` | Nuxt typecheck (`vue-tsc`) |
| `bun test` | Run all tests |
| `bun run release` | Tag and release (see `scripts/release.sh`) |

## Project structure

```
app/
  components/room/    # UI components: NowPlaying, SongSearch, SongQueue, AudioPlayer, SpotifyPlayer, SpotifyConnectBanner, CookieUpload
  composables/        # useSpotifyAuth, useSpotifyPlayer (singleton module refs)
  pages/app/room/     # [id].vue — main room page (orchestrator, ~590 lines)
server/
  api/                # API endpoints: room/*, spotify/*, youtube/*, soundcloud/*, cookies.*
  utils/              # room.ts, spotify.ts, youtube.ts, soundcloud.ts, cookies.ts, cookie-fetcher.ts, yt-dlp-errors.ts, room-events.ts, logger.ts
shared/types/         # room.ts, spotify.ts — shared TypeScript types
tests/                # room.test.ts, yt-dlp-errors.test.ts
```

## Architecture notes

- **Room state** is in-memory (`Map<string, Room>`), not persisted
- **Queue is hybrid** — songs have a `source` field (`youtube` | `spotify` | `soundcloud`), player switches automatically
- **Spotify search** uses Client Credentials flow (no user auth); **playback** uses Authorization Code flow (Web Playback SDK, Premium required)
- **useSpotifyAuth / useSpotifyPlayer** are module-level singletons so page and all components share the same auth/player state
- **Audio player** is an `<audio>` element in AudioPlayer.vue — handles YouTube direct audio and SoundCloud HLS streams, exposes `play(url)` / `pause()`
- **Cookies** are stored at `data/cookies.txt` (global, single file for all rooms), cleared/verified on upload
- **Firefox** is detected at Spotify init — shows error message, never loads the SDK

## API response format

All API endpoints use `ApiResponse<T>` / `Result<T, E>` from `shared/utils/result.ts`:

- **Success:** `return success(data)` — returns `{ success: true, data }`
- **Error:** `throw createError({ statusCode, statusMessage })` _or_ `return failure(error)` — returns `{ success: false, error }`

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
- **Catch format** – always capture the error object: `catch (err: unknown) { error.value = \`...\` }`. Include `err instanceof Error ? err.message` for context.
- **Keep background/supplementary failures silent** – things like `visibilitychange` handlers or fire-and-forget REST calls can swallow errors with `catch(() => {})`.
- **Don't expose secrets** – error messages should never include tokens, passwords, or cookie contents.
