# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [0.1.2] - 2026-11-27

### Commits

- [`89db15f`](https://github.com/Snoozyman/quefy/commit/89db15ff12c2f3665b9be1ebee916f2849d3900f) chore: add missing prettier and eslint-config-prettier deps
- [`04173ab`](https://github.com/Snoozyman/quefy/commit/04173ab077bd62fedd6af0956922eb2addb6e6d6) refactor: rename Header component to AppHeader
- [`6199e32`](https://github.com/Snoozyman/quefy/commit/6199e3213ffaa071cf984f14b3c9d94586988e20) fix: resolve all eslint errors and warnings
- [`4a799b5`](https://github.com/Snoozyman/quefy/commit/4a799b552229295659e9ec908767c75d5811e94c) Merge pull request #87 from Snoozyman/chore/lint-deps
- [`4daecbc`](https://github.com/Snoozyman/quefy/commit/4daecbcb7e891c48533e3c49687d60bcdf81964c) fix: require a room host token to change server cookies
- [`277c892`](https://github.com/Snoozyman/quefy/commit/277c8922690d53ea50a5448236da11d23b258e6a) fix: remove unauthenticated debug audio endpoint
- [`89a9ddb`](https://github.com/Snoozyman/quefy/commit/89a9ddbbe45ab0f2d8578a62346ee02831dbdca0) fix: validate media URLs before passing them to yt-dlp
- [`581860f`](https://github.com/Snoozyman/quefy/commit/581860f00f653dcf3adb4ca603d894598ac0bf8a) fix: redact host tokens and OAuth secrets from request logs
- [`d3863cb`](https://github.com/Snoozyman/quefy/commit/d3863cbf91132260ad25c6fba9f3f995683e8fef) fix: verify Spotify OAuth state and pass tokens in URL fragment
- [`b1e71d1`](https://github.com/Snoozyman/quefy/commit/b1e71d1f7ee5a1ff165328c598bc0c73f1c1ae7c) fix: fetch cookies asynchronously so curl never blocks the server
- [`eecb873`](https://github.com/Snoozyman/quefy/commit/eecb873f12a96668adf6752206c3be0b6e7d148f) fix: only seed anonymous cookies for sites that have none
- [`3587ee4`](https://github.com/Snoozyman/quefy/commit/3587ee4f6a575aefd6d4603926a05422f49beaf0) Merge pull request #88 from Snoozyman/fix/security-hardening
- [`15dab87`](https://github.com/Snoozyman/quefy/commit/15dab876f54775210341fdca69bebb287c4fe018) fix: let room SSE reconnect instead of falling back to polling forever
- [`4ea7f3e`](https://github.com/Snoozyman/quefy/commit/4ea7f3e4ba2131e07771f5932327f85ca8f3f27b) fix: give a disconnected host 15s to reconnect before pausing
- [`be0216f`](https://github.com/Snoozyman/quefy/commit/be0216fad3eb2ba1ad658097526728aeb69fcb35) Merge pull request #89 from Snoozyman/fix/cookie-fetch-blocking
- [`191a309`](https://github.com/Snoozyman/quefy/commit/191a309384c2b7e7b759b40d0cb595a277bc0267) Merge pull request #90 from Snoozyman/fix/sse-reconnect
- [`2945d6e`](https://github.com/Snoozyman/quefy/commit/2945d6e303383b5aa7648c896c1888fc043ad863) refactor: route all room state changes through room.ts
- [`8dcd5fe`](https://github.com/Snoozyman/quefy/commit/8dcd5fecf991ae1cd972bfd727410b7710583a6b) fix: show room not found when the host deletes the room
- [`79d94bb`](https://github.com/Snoozyman/quefy/commit/79d94bb75bf71ac14453047e5935823b78be725f) refactor: merge the four audio refresh paths into one function
- [`175adba`](https://github.com/Snoozyman/quefy/commit/175adba6edd1478be04d45a72598d1fa12260891) chore: remove unused helpers, Result util and websocket flag
- [`b3f8a0d`](https://github.com/Snoozyman/quefy/commit/b3f8a0de95bfca806aac5674e2d8e3c2adf2de5f) docs: update AGENTS.md to match the current architecture
- [`351d489`](https://github.com/Snoozyman/quefy/commit/351d48937efc7d1fbec34aa307f0f88aff1dace2) Merge pull request #91 from Snoozyman/refactor/room-state
- [`068185d`](https://github.com/Snoozyman/quefy/commit/068185d5cae42de7a7becf475f6d369eab18f1bf) feat: refresh cookies automatically when yt-dlp is blocked
- [`a09c26a`](https://github.com/Snoozyman/quefy/commit/a09c26a0c5f8b41c395a5c4af8b5148dcc074e3c) fix: wait for stream URLs to activate before returning them
- [`5a21b05`](https://github.com/Snoozyman/quefy/commit/5a21b052e0fda8b590b4805e2729d918c137364b) feat: redesign the home, lobby and room list pages
- [`f926df9`](https://github.com/Snoozyman/quefy/commit/f926df90a6ec30ae0ba2e8fd6e2a1cf1b870dae7) feat: redesign the room page around a shared player card
- [`362f689`](https://github.com/Snoozyman/quefy/commit/362f689537229f9cfef81d622dfbe2679984411d) fix: keep Spotify playing when the SDK reports a false pause
- [`b9e3f20`](https://github.com/Snoozyman/quefy/commit/b9e3f20c55b1eddeb276a69db58f15dd14b6a83c) feat: prefetch the next song for gapless background playback
- [`bde7962`](https://github.com/Snoozyman/quefy/commit/bde79629e88338c872d9800ef41c6df7a8274969) Merge pull request #94 from Snoozyman/feat/room-ui
- [`cb00bb2`](https://github.com/Snoozyman/quefy/commit/cb00bb2de04744ad66b7355450eeb0db481837b0) Merge branch 'main' into refactor/audio-refresh
- [`60969af`](https://github.com/Snoozyman/quefy/commit/60969af2f457d64c772a25e69e06244043a2dd54) Merge branch 'main' into chore/cleanup-and-docs
- [`eca74f7`](https://github.com/Snoozyman/quefy/commit/eca74f7b3ac2f083574de14128af30c46fc5fe14) docs: list the new room UI and cookie refresh files in AGENTS.md
- [`0e22e9b`](https://github.com/Snoozyman/quefy/commit/0e22e9b9b6e06d5aa8529f82fc238d7b6a4953bb) Merge pull request #92 from Snoozyman/refactor/audio-refresh
- [`44d0b05`](https://github.com/Snoozyman/quefy/commit/44d0b0577065deb0783843173ceef562d6eeaa08) Merge pull request #93 from Snoozyman/chore/cleanup-and-docs

## [0.1.1] - 2026-07-18

### Commits

- [`0b6bd4d`](https://github.com/Snoozyman/quefy/commit/0b6bd4d3cf8946ba23f9a916bec7be1bb0e1fb2c) feat: add queue reorder server function and API endpoint
- [`2d6a84a`](https://github.com/Snoozyman/quefy/commit/2d6a84a00f4c30cd50fb3d29064e3b4e1bf87987) feat: add drag-and-drop queue reorder to SongQueue
- [`b0e6bf9`](https://github.com/Snoozyman/quefy/commit/b0e6bf96002ed22dfccb8264cdf42fe410cec959) Merge pull request #79 from Snoozyman/feat/drag-reorder-queue
- [`a4e38c3`](https://github.com/Snoozyman/quefy/commit/a4e38c378208c4e80503f37c6d2875ac04da9edd) fix: youtube player skipping whole queue on error
- [`91f9522`](https://github.com/Snoozyman/quefy/commit/91f9522ba45ea62cd6d6e3a517bd11905d12d1d8) feat: add duration display to search results and queue
- [`ec0648a`](https://github.com/Snoozyman/quefy/commit/ec0648a6e028313b3dfba2136fbcc0f7b955e821) Merge pull request #81 from Snoozyman/fix/youtube-player-skip-queue
- [`e1eef39`](https://github.com/Snoozyman/quefy/commit/e1eef3919a02094d31fbbe04d30ad7877282c9a9) feat: limit audio resolution retries to 5 with manual refresh
- [`5111a29`](https://github.com/Snoozyman/quefy/commit/5111a296240952a0a979475cffa3b18b314bbcee) Merge pull request #82 from Snoozyman/feat/audio-retry-limit
- [`5a66d99`](https://github.com/Snoozyman/quefy/commit/5a66d9948363bb9a526be4898d055255425211c4) feat: prepare lazy audio resolution for youtube songs
- [`7ee5c64`](https://github.com/Snoozyman/quefy/commit/7ee5c6447ffe4d4135094844a411ad69b0af31a3) feat: import queue from youtube playlist or queued json
- [`b07f8a4`](https://github.com/Snoozyman/quefy/commit/b07f8a4d511b4dfb10fcbecbe804473a0c1c3a03) Merge pull request #83 from Snoozyman/feat/import-queue
- [`f0416d2`](https://github.com/Snoozyman/quefy/commit/f0416d2fa7b61ce39a27a88637ac183a2bb6b923) fix: add retry limit to onAudioExpired
- [`a6d6e39`](https://github.com/Snoozyman/quefy/commit/a6d6e391d0e9638c69d8a8c1333d3c89f021a20b) Merge pull request #84 from Snoozyman/fix/audio-expired-retry
- [`80d8610`](https://github.com/Snoozyman/quefy/commit/80d8610c7964acf332cd53261c59be363da46c32) fix: stop clearing retry count on refresh success
- [`89ad447`](https://github.com/Snoozyman/quefy/commit/89ad44761fe2df8ad51dc023271c65721b9a23ed) Merge pull request #85 from Snoozyman/fix/retry-count-not-accumulating
- [`c18f0e7`](https://github.com/Snoozyman/quefy/commit/c18f0e772fc545d9a3935cd9d34fa4d799560288) fix: stop infinite audio retry loop
- [`0faccb3`](https://github.com/Snoozyman/quefy/commit/0faccb3962e3b2dec7fdc5d3bd2e60b8a9a68b13) Merge pull request #86 from Snoozyman/fix/audio-retry-final

## [0.1.0] - 2026-07-03

### About

Initial release of Quefy — a multi-user YouTube / Spotify / SoundCloud audio streaming room application. Built with Nuxt 4, Nuxt UI v4, Tailwind CSS v4, and Bun.

### Features

- Real-time multi-user rooms with SSE state sync
- YouTube playback via yt-dlp direct audio extraction
- Spotify playback via Web Playback SDK (Premium required)
- SoundCloud playback via HLS.js
- Song queue management with automatic transitions
- Cookie-based YouTube/SoundCloud authentication
- PWA support with iOS lock screen audio
