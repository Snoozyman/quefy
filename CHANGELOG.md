# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
