# Commit conventions

- Each commit should contain one logical change
- Write commit messages in the format: `type: short description`
  Types: `feat`, `fix`, `refactor`, `docs`, `ci`, `chore`, `test`
- The description should complete the sentence "This commit will..."
- Bullet points in messages mean the commit is too big — split it
- Avoid "oops" / "fixup" / "wip" commits — amend or rebase instead
- Keep messages under 72 characters for the first line

# Project: Quefy

Multi-user YouTube / Spotify audio streaming rooms.

## Tech stack

- **Framework:** Nuxt 4, Nuxt UI v4, Tailwind CSS v4
- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Lint:** ESLint with `@nuxt/eslint` (stylistic: comma-dangle never, brace 1tbs)
- **Test:** Bun test (no Jest/Vitest)
- **PWA:** `@vite-pwa/nuxt`
- **Media:** yt-dlp (YouTube), Spotify Web Playback SDK / Web API (Spotify)

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
  components/room/    # UI components: NowPlaying, SongSearch, SongQueue, etc.
  composables/        # useSpotifyAuth, useSpotifyPlayer (singleton module refs)
  pages/app/room/     # [id].vue — main room page (orchestrator, ~295 lines)
server/
  api/                # API endpoints: room/*, spotify/*, youtube/*, cookies.*
  utils/              # room.ts, spotify.ts, youtube.ts, cookies.ts, yt-dlp-errors.ts
shared/types/         # room.ts, spotify.ts — shared TypeScript types
tests/                # room.test.ts, yt-dlp-errors.test.ts
```

## Architecture notes

- **Room state** is in-memory (`Map<string, Room>`), not persisted
- **Queue is hybrid** — songs have a `source` field (`youtube` | `spotify`), player switches automatically
- **Spotify search** uses Client Credentials flow (no user auth); **playback** uses Authorization Code flow (Web Playback SDK, Premium required)
- **useSpotifyAuth / useSpotifyPlayer** are module-level singletons so page and all components share the same auth/player state
- **YouTube player** is an `<audio>` element in YouTubePlayer.vue — owns all audio state internally, exposes `play(url)` / `pause()`
- **Cookies** are stored at `data/cookies.txt` (global, single file for all rooms), cleared/verified on upload
- **Firefox** is detected at Spotify init — shows error message, never loads the SDK

## Code style reminders

- Use `err: unknown` in catch blocks, check `err instanceof Error`, preserve `cause` on rethrow
- Prefer Nuxt UI v4 components; `UButtonGroup` removed — use `div.flex.gap-px`
- Use `$fetch` for client-server calls
- Keep `<script setup>` with TypeScript; no Options API
- Use `definePageMeta` sparingly (SSR is disabled for `/app/**`)
