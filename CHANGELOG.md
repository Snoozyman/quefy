# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [0.2.3] - 2026-07-01

### Commits

- [`8fdfd70`](https://github.com/Snoozyman/quefy/commit/8fdfd70cb58d0ea2e5fc871014223907a672c53f) fix: cap spotify position at duration after seeking near end
- [`2dcbe79`](https://github.com/Snoozyman/quefy/commit/2dcbe7920616dd5f38ba137deb3e3951852329d8) Merge pull request #22 from Snoozyman/fix/spotify-position-cap
- [`caee75c`](https://github.com/Snoozyman/quefy/commit/caee75c7f8b93e39ad4e8e4e0f198b3dc412652b) fix: gate autoplay behind user activation for Safari
- [`a661b4c`](https://github.com/Snoozyman/quefy/commit/a661b4c720de9732d9e4228dfcfe3c00b1d3ff3f) Merge pull request #23 from Snoozyman/fix/safari-autoplay
- [`bdee68f`](https://github.com/Snoozyman/quefy/commit/bdee68f5047d2a7cf7ea01cb563836680df5bcd2) fix: prevent double play causing queue to disappear
- [`3881796`](https://github.com/Snoozyman/quefy/commit/38817961a0bb2275df25064f55a68834bc834a2c) Merge pull request #24 from Snoozyman/fix/toggleplay-race
- [`395a4dd`](https://github.com/Snoozyman/quefy/commit/395a4dd66e1a0254e972226df64e11baaeba7f9b) docs: add workflow conventions to AGENTS.md
- [`addb4f3`](https://github.com/Snoozyman/quefy/commit/addb4f3ea4afb9cb22110302fcade9006005de0d) Merge pull request #25 from Snoozyman/docs/workflow
- [`245e125`](https://github.com/Snoozyman/quefy/commit/245e125d25ca7ab313537187415b57938d46b0c8) Create labeler.yml
- [`1a4fc8b`](https://github.com/Snoozyman/quefy/commit/1a4fc8b5e7641713b05d9fa0cafb0430d8d94de0) Create pr-labeler.yml
- [`d5d847a`](https://github.com/Snoozyman/quefy/commit/d5d847a4e21cf095abcfd357cc39a21878ee4479) fix: safari volume slider, mute, and hardware keys
- [`4b19bf3`](https://github.com/Snoozyman/quefy/commit/4b19bf3ca4dc44f04df67de7a74c87762ee3070b) Merge pull request #26 from Snoozyman/fix/safari-volume
- [`0499d81`](https://github.com/Snoozyman/quefy/commit/0499d8199712eb93dafe51aba25a794fd6daeb4d) fix: missing button end tag in AudioPlayer
- [`94bd699`](https://github.com/Snoozyman/quefy/commit/94bd6999ed44e8ab754394223e58626ffb214a30) Merge pull request #27 from Snoozyman/hotfix/button-end-tag
- [`7dd0524`](https://github.com/Snoozyman/quefy/commit/7dd0524e5eab7d6a7e730ba54e8df08053e04e62) feat: add spotifyConnected to room state
- [`88b4db0`](https://github.com/Snoozyman/quefy/commit/88b4db02c6a8ac15655ef5787acaae1e27f54d1a) feat: add spotify ready and disconnect endpoints
- [`3ffb090`](https://github.com/Snoozyman/quefy/commit/3ffb09085da80088a7cb0da299760b645deb27f9) feat: broadcast spotify connection state from client
- [`0a55f5d`](https://github.com/Snoozyman/quefy/commit/0a55f5d45e7f9648e134d5cdc22ab1b56a33e18c) feat: disable spotify search when host not connected
- [`2b107e9`](https://github.com/Snoozyman/quefy/commit/2b107e9c46bdbbd820ab1adb8cc954b3e306e907) Merge pull request #29 from Snoozyman/feat/spotify-connection-state
- [`1aad86a`](https://github.com/Snoozyman/quefy/commit/1aad86a81212615dd344edf14e5bc0301dbd354e) docs: add issue templates
- [`dfe0084`](https://github.com/Snoozyman/quefy/commit/dfe008479e0a367fb9bc636d0c7e5843a43b5710) Merge pull request #30 from Snoozyman/docs/issue-templates
- [`75edb54`](https://github.com/Snoozyman/quefy/commit/75edb54c4bd1a5fce107bb2ecaaa9c97821d4612) docs: add bug report link to readme
- [`28e5e98`](https://github.com/Snoozyman/quefy/commit/28e5e98df880e5a5556513d0618a3ef049ac808e) Merge pull request #31 from Snoozyman/docs/bug-report-readme
- [`74e5f74`](https://github.com/Snoozyman/quefy/commit/74e5f74ab099bb007a78b83f52f09ededc97429c) docs: update homepage copy to reflect actual features
- [`a36d762`](https://github.com/Snoozyman/quefy/commit/a36d7621fbc8920c8ba76edb06708dacd4267696) fix: validate cookie format and fix leading-newline corruption
- [`a2be5a5`](https://github.com/Snoozyman/quefy/commit/a2be5a5854849e0fc1ddae6a6792e0857b094c3f) Merge pull request #32 from Snoozyman/docs/homepage-copy
- [`251086d`](https://github.com/Snoozyman/quefy/commit/251086d900f4875c97b72f9f1026e132e5e40030) Merge pull request #33 from Snoozyman/fix/cookie-format-validation
- [`3e6e00b`](https://github.com/Snoozyman/quefy/commit/3e6e00bda6ed147989be894956586e56b28cf7fd) feat: add parseNetscapeCookies helper
- [`6016b53`](https://github.com/Snoozyman/quefy/commit/6016b53de16ff1ec3db4f6ebb752e89a86bc37d5) feat: return parsed cookies from cookie APIs
- [`9accc40`](https://github.com/Snoozyman/quefy/commit/9accc40ae9506ef2f47baee760069ede5634d3b3) feat: show cookie tabs in upload UI
- [`70db44b`](https://github.com/Snoozyman/quefy/commit/70db44bc3c845910554cf139340ebb080bfdef8e) feat: add player and settings tabs to room view
- [`47d7e84`](https://github.com/Snoozyman/quefy/commit/47d7e845e198a6e6d804b56bf04cb3db226f683b) Merge pull request #34 from Snoozyman/feat/cookie-and-room-tabs
- [`9acecc9`](https://github.com/Snoozyman/quefy/commit/9acecc98a5ec8b0e16509f57e2387626ee047397) feat: add isPlaying and thumbnail to room list endpoint
- [`a3a979f`](https://github.com/Snoozyman/quefy/commit/a3a979fafeb9404a6894e6763fd6f66386a35857) feat: polish overview page with live indicators and UCard layout
- [`a92718e`](https://github.com/Snoozyman/quefy/commit/a92718e62dbc1887a8cfdbe44f1463e53c33b758) Merge pull request #35 from Snoozyman/feat/overview-polish
## [0.2.2] - 2026-06-30

### Commits

- [`5e2fae7`](https://github.com/Snoozyman/quefy/commit/5e2fae778eb223d0448226ea5d53f4828cb16c8a) fix: suppress playback_error events when Spotify is paused
- [`13e848c`](https://github.com/Snoozyman/quefy/commit/13e848c5ea5c0fe15d4189fc758e0ef66d9c9635) Merge pull request #12 from Snoozyman/fix/spotify-playback-error
- [`27019d3`](https://github.com/Snoozyman/quefy/commit/27019d37565d4519b5d590544bd17dae4371a00b) Update nightly-docker.yml
- [`5d7209a`](https://github.com/Snoozyman/quefy/commit/5d7209a3a68d5609be95fee1fca0af96967e4455) fix: wait for HLS manifest before playing audio
- [`3b595b8`](https://github.com/Snoozyman/quefy/commit/3b595b873ba9a9db3a81b11b75571c16665a51ef) Merge pull request #13 from Snoozyman/fix/hls-playback-blocked
- [`5805397`](https://github.com/Snoozyman/quefy/commit/5805397684eaf5e6814fbe0f0bee85ad853292dd) fix: align search source buttons evenly on mobile
- [`8679a03`](https://github.com/Snoozyman/quefy/commit/8679a03a4c0fb326c9c052c2f5b58c2100ab27f8) Merge pull request #14 from Snoozyman/fix/search-button-layout
- [`a0d1567`](https://github.com/Snoozyman/quefy/commit/a0d1567f75b9090241dba8500035014287be14d1) chore: consistent semicolons and formatting
- [`e233b07`](https://github.com/Snoozyman/quefy/commit/e233b0785f20fbc79bb98596faaef845ebb6906e) Merge pull request #15 from Snoozyman/chore/formatting
- [`1d4eb5a`](https://github.com/Snoozyman/quefy/commit/1d4eb5ab278378fc3f50138398766b7cf86c9aee) fix: simplify document title to song — artist — Quefy
- [`440ed95`](https://github.com/Snoozyman/quefy/commit/440ed955f25444e28391ce5774ae6f46eaea794f) Merge pull request #16 from Snoozyman/fix/document-title
- [`e065711`](https://github.com/Snoozyman/quefy/commit/e065711b83150f682d6c3306161333e67b02d347) fix: prevent double handleSongChange and handle expired SC URLs
- [`c21c38b`](https://github.com/Snoozyman/quefy/commit/c21c38bd077232db1a2891c820e222a757a978f5) Merge pull request #17 from Snoozyman/fix/skip-autoplay-expired-url
- [`0fa411a`](https://github.com/Snoozyman/quefy/commit/0fa411a3f4794333594c0188b5d65c2fe4bfcdd6) fix: disable onTrackEnd before pausing Spotify
- [`97d4eba`](https://github.com/Snoozyman/quefy/commit/97d4eba34a1716724614279c77fc09d617f03cdd) Merge pull request #18 from Snoozyman/fix/spotify-to-youtube-autoplay
- [`66b0d78`](https://github.com/Snoozyman/quefy/commit/66b0d784ea5a7fefeccfb177db9403e51adce1c5) fix: use nextTick for youtube playback after spotify
- [`27ea30b`](https://github.com/Snoozyman/quefy/commit/27ea30b396929549909718f528ae02d78a77dd51) Merge pull request #19 from Snoozyman/fix/spotify-to-youtube
- [`ef74d27`](https://github.com/Snoozyman/quefy/commit/ef74d27fcbf130760d55ebbdc3f8cc827c58a048) fix: prevent host privileges from being lost on refresh
- [`07eab37`](https://github.com/Snoozyman/quefy/commit/07eab3706395edaec67c06b7f8cef96be82d12f2) Merge pull request #20 from Snoozyman/fix/host-privileges
- [`a8c4150`](https://github.com/Snoozyman/quefy/commit/a8c4150abdbe051e8a56c22a95dcc3bfd542dfdf) chore: update changelog for v0.2.2
- [`3f33635`](https://github.com/Snoozyman/quefy/commit/3f33635f5bcc824b1399308992504807c1aa3f54) chore: update changelog for v0.2.2
- [`d32b9e7`](https://github.com/Snoozyman/quefy/commit/d32b9e70af67bba11dde70f0b50f726dc02e5136) fix: add missing closing brace in SpotifyConnectBanner
- [`40452be`](https://github.com/Snoozyman/quefy/commit/40452beb70ffcfeade2615602244977082984139) Merge pull request #21 from Snoozyman/hotfix/missing-brace
## [0.2.2] - 2026-06-30

### Commits

- [`5e2fae7`](https://github.com/Snoozyman/quefy/commit/5e2fae778eb223d0448226ea5d53f4828cb16c8a) fix: suppress playback_error events when Spotify is paused
- [`13e848c`](https://github.com/Snoozyman/quefy/commit/13e848c5ea5c0fe15d4189fc758e0ef66d9c9635) Merge pull request #12 from Snoozyman/fix/spotify-playback-error
- [`27019d3`](https://github.com/Snoozyman/quefy/commit/27019d37565d4519b5d590544bd17dae4371a00b) Update nightly-docker.yml
- [`5d7209a`](https://github.com/Snoozyman/quefy/commit/5d7209a3a68d5609be95fee1fca0af96967e4455) fix: wait for HLS manifest before playing audio
- [`3b595b8`](https://github.com/Snoozyman/quefy/commit/3b595b873ba9a9db3a81b11b75571c16665a51ef) Merge pull request #13 from Snoozyman/fix/hls-playback-blocked
- [`5805397`](https://github.com/Snoozyman/quefy/commit/5805397684eaf5e6814fbe0f0bee85ad853292dd) fix: align search source buttons evenly on mobile
- [`8679a03`](https://github.com/Snoozyman/quefy/commit/8679a03a4c0fb326c9c052c2f5b58c2100ab27f8) Merge pull request #14 from Snoozyman/fix/search-button-layout
- [`a0d1567`](https://github.com/Snoozyman/quefy/commit/a0d1567f75b9090241dba8500035014287be14d1) chore: consistent semicolons and formatting
- [`e233b07`](https://github.com/Snoozyman/quefy/commit/e233b0785f20fbc79bb98596faaef845ebb6906e) Merge pull request #15 from Snoozyman/chore/formatting
- [`1d4eb5a`](https://github.com/Snoozyman/quefy/commit/1d4eb5ab278378fc3f50138398766b7cf86c9aee) fix: simplify document title to song — artist — Quefy
- [`440ed95`](https://github.com/Snoozyman/quefy/commit/440ed955f25444e28391ce5774ae6f46eaea794f) Merge pull request #16 from Snoozyman/fix/document-title
- [`e065711`](https://github.com/Snoozyman/quefy/commit/e065711b83150f682d6c3306161333e67b02d347) fix: prevent double handleSongChange and handle expired SC URLs
- [`c21c38b`](https://github.com/Snoozyman/quefy/commit/c21c38bd077232db1a2891c820e222a757a978f5) Merge pull request #17 from Snoozyman/fix/skip-autoplay-expired-url
- [`0fa411a`](https://github.com/Snoozyman/quefy/commit/0fa411a3f4794333594c0188b5d65c2fe4bfcdd6) fix: disable onTrackEnd before pausing Spotify
- [`97d4eba`](https://github.com/Snoozyman/quefy/commit/97d4eba34a1716724614279c77fc09d617f03cdd) Merge pull request #18 from Snoozyman/fix/spotify-to-youtube-autoplay
- [`66b0d78`](https://github.com/Snoozyman/quefy/commit/66b0d784ea5a7fefeccfb177db9403e51adce1c5) fix: use nextTick for youtube playback after spotify
- [`27ea30b`](https://github.com/Snoozyman/quefy/commit/27ea30b396929549909718f528ae02d78a77dd51) Merge pull request #19 from Snoozyman/fix/spotify-to-youtube
- [`ef74d27`](https://github.com/Snoozyman/quefy/commit/ef74d27fcbf130760d55ebbdc3f8cc827c58a048) fix: prevent host privileges from being lost on refresh
- [`07eab37`](https://github.com/Snoozyman/quefy/commit/07eab3706395edaec67c06b7f8cef96be82d12f2) Merge pull request #20 from Snoozyman/fix/host-privileges
- [`a8c4150`](https://github.com/Snoozyman/quefy/commit/a8c4150abdbe051e8a56c22a95dcc3bfd542dfdf) chore: update changelog for v0.2.2
## [0.2.2] - 2026-06-30

### Commits

- [`5e2fae7`](https://github.com/Snoozyman/quefy/commit/5e2fae778eb223d0448226ea5d53f4828cb16c8a) fix: suppress playback_error events when Spotify is paused
- [`13e848c`](https://github.com/Snoozyman/quefy/commit/13e848c5ea5c0fe15d4189fc758e0ef66d9c9635) Merge pull request #12 from Snoozyman/fix/spotify-playback-error
- [`27019d3`](https://github.com/Snoozyman/quefy/commit/27019d37565d4519b5d590544bd17dae4371a00b) Update nightly-docker.yml
- [`5d7209a`](https://github.com/Snoozyman/quefy/commit/5d7209a3a68d5609be95fee1fca0af96967e4455) fix: wait for HLS manifest before playing audio
- [`3b595b8`](https://github.com/Snoozyman/quefy/commit/3b595b873ba9a9db3a81b11b75571c16665a51ef) Merge pull request #13 from Snoozyman/fix/hls-playback-blocked
- [`5805397`](https://github.com/Snoozyman/quefy/commit/5805397684eaf5e6814fbe0f0bee85ad853292dd) fix: align search source buttons evenly on mobile
- [`8679a03`](https://github.com/Snoozyman/quefy/commit/8679a03a4c0fb326c9c052c2f5b58c2100ab27f8) Merge pull request #14 from Snoozyman/fix/search-button-layout
- [`a0d1567`](https://github.com/Snoozyman/quefy/commit/a0d1567f75b9090241dba8500035014287be14d1) chore: consistent semicolons and formatting
- [`e233b07`](https://github.com/Snoozyman/quefy/commit/e233b0785f20fbc79bb98596faaef845ebb6906e) Merge pull request #15 from Snoozyman/chore/formatting
- [`1d4eb5a`](https://github.com/Snoozyman/quefy/commit/1d4eb5ab278378fc3f50138398766b7cf86c9aee) fix: simplify document title to song — artist — Quefy
- [`440ed95`](https://github.com/Snoozyman/quefy/commit/440ed955f25444e28391ce5774ae6f46eaea794f) Merge pull request #16 from Snoozyman/fix/document-title
- [`e065711`](https://github.com/Snoozyman/quefy/commit/e065711b83150f682d6c3306161333e67b02d347) fix: prevent double handleSongChange and handle expired SC URLs
- [`c21c38b`](https://github.com/Snoozyman/quefy/commit/c21c38bd077232db1a2891c820e222a757a978f5) Merge pull request #17 from Snoozyman/fix/skip-autoplay-expired-url
- [`0fa411a`](https://github.com/Snoozyman/quefy/commit/0fa411a3f4794333594c0188b5d65c2fe4bfcdd6) fix: disable onTrackEnd before pausing Spotify
- [`97d4eba`](https://github.com/Snoozyman/quefy/commit/97d4eba34a1716724614279c77fc09d617f03cdd) Merge pull request #18 from Snoozyman/fix/spotify-to-youtube-autoplay
- [`66b0d78`](https://github.com/Snoozyman/quefy/commit/66b0d784ea5a7fefeccfb177db9403e51adce1c5) fix: use nextTick for youtube playback after spotify
- [`27ea30b`](https://github.com/Snoozyman/quefy/commit/27ea30b396929549909718f528ae02d78a77dd51) Merge pull request #19 from Snoozyman/fix/spotify-to-youtube
- [`ef74d27`](https://github.com/Snoozyman/quefy/commit/ef74d27fcbf130760d55ebbdc3f8cc827c58a048) fix: prevent host privileges from being lost on refresh
- [`07eab37`](https://github.com/Snoozyman/quefy/commit/07eab3706395edaec67c06b7f8cef96be82d12f2) Merge pull request #20 from Snoozyman/fix/host-privileges
## [0.2.1] - 2026-06-30

### Commits

- [`a115310`](https://github.com/Snoozyman/quefy/commit/a1153103ff74cd8f1c05e6e4c7ccf759a3def75a) fix: add browser headers to SoundCloud search
- [`111eaff`](https://github.com/Snoozyman/quefy/commit/111eaff91beb875319c13eedd485c0b5d74fb7f7) Merge pull request #9 from Snoozyman/fix/soundcloud-search-502
- [`472e7f9`](https://github.com/Snoozyman/quefy/commit/472e7f9c2bb48c9a6cfc70e88f0ec02e61aba7e9) fix: use cookies for SoundCloud API requests
- [`d3b42a8`](https://github.com/Snoozyman/quefy/commit/d3b42a8a5bd7689b0408f451ffa6f272a43e2cb1) Merge pull request #10 from Snoozyman/fix/soundcloud-cookies
- [`c2dccb5`](https://github.com/Snoozyman/quefy/commit/c2dccb5e1ec4afc604ab78a126843fbeac264976) fix: scrape fresh SoundCloud client_id from homepage
- [`7a146be`](https://github.com/Snoozyman/quefy/commit/7a146be60293e8c3f07e59d9348339a9a229052e) Merge pull request #11 from Snoozyman/fix/soundcloud-client-id
- [`0ddea71`](https://github.com/Snoozyman/quefy/commit/0ddea71e1362e84d1784ce428ab7dbfe23876274) chore: update changelog for v0.2.1
## [0.2.1] - 2026-06-30

### Commits

- [`a115310`](https://github.com/Snoozyman/quefy/commit/a1153103ff74cd8f1c05e6e4c7ccf759a3def75a) fix: add browser headers to SoundCloud search
- [`111eaff`](https://github.com/Snoozyman/quefy/commit/111eaff91beb875319c13eedd485c0b5d74fb7f7) Merge pull request #9 from Snoozyman/fix/soundcloud-search-502
- [`472e7f9`](https://github.com/Snoozyman/quefy/commit/472e7f9c2bb48c9a6cfc70e88f0ec02e61aba7e9) fix: use cookies for SoundCloud API requests
- [`d3b42a8`](https://github.com/Snoozyman/quefy/commit/d3b42a8a5bd7689b0408f451ffa6f272a43e2cb1) Merge pull request #10 from Snoozyman/fix/soundcloud-cookies
- [`c2dccb5`](https://github.com/Snoozyman/quefy/commit/c2dccb5e1ec4afc604ab78a126843fbeac264976) fix: scrape fresh SoundCloud client_id from homepage
- [`7a146be`](https://github.com/Snoozyman/quefy/commit/7a146be60293e8c3f07e59d9348339a9a229052e) Merge pull request #11 from Snoozyman/fix/soundcloud-client-id
## [0.2.0] - 2026-06-30

### Commits

- [`315434c`](https://github.com/Snoozyman/quefy/commit/315434c0ced4ea4d08a567aaf6b12868c3cab04f) fix: delete button show only if host
- [`e7a2907`](https://github.com/Snoozyman/quefy/commit/e7a29071057d9ae7c5086c560661c83bc11085b2) fix: room buttons
- [`75fa508`](https://github.com/Snoozyman/quefy/commit/75fa50845ab3fb616fc86eb58a5332ae7b540483) Merge pull request #2 from Snoozyman:bug-mobile-ui-layout
- [`dbd816b`](https://github.com/Snoozyman/quefy/commit/dbd816b2a012793ce4fd63b2bed46a41addfb16f) feat: SoundCloud support
- [`ccf847c`](https://github.com/Snoozyman/quefy/commit/ccf847cdb364a615c9e3ac9ae8ba4b96ba845ad5) feat: add HLS support for SoundCloud audio
- [`06405ff`](https://github.com/Snoozyman/quefy/commit/06405ffe79caba50991425af83f6682187106d7d) fix: better SoundCloud error handling and format fallback
- [`f656742`](https://github.com/Snoozyman/quefy/commit/f656742f0072eb736beea9bab8cd9588c17d0c34) Merge pull request #3 from Snoozyman:soundcloud-support
- [`a583e5e`](https://github.com/Snoozyman/quefy/commit/a583e5ebb89012278b4b2921c630b8e686baf92d) feat: add volume slider to Spotify player
- [`5187ae4`](https://github.com/Snoozyman/quefy/commit/5187ae42e5d16d150609cb640959e99004b28a90) fix: prevent multiple players from playing simultaneously
- [`5f67ca9`](https://github.com/Snoozyman/quefy/commit/5f67ca98def3ee12f32e023538af840ef4da05b0) Merge pull request #4 from Snoozyman/bug-fix-multiple-players
- [`551cce0`](https://github.com/Snoozyman/quefy/commit/551cce00d359067ff5bddb44f58d96da7a1ba76b) fix: hide Spotify player when current song is not spotify
- [`efa4846`](https://github.com/Snoozyman/quefy/commit/efa484688ec3ea3e750f9161d528429dccb9b5e4) fix: show SoundCloud search thumbnails
- [`63c6030`](https://github.com/Snoozyman/quefy/commit/63c6030967c26a2d3e7d5d3c539421103385a23a) Merge pull request #5 from Snoozyman/fix/spotify-player-hide
- [`34867b9`](https://github.com/Snoozyman/quefy/commit/34867b98710a2802e6f83144a64f8b4c57d8d0b9) Merge pull request #6 from Snoozyman/fix/soundcloud-thumbnails
- [`182ae41`](https://github.com/Snoozyman/quefy/commit/182ae418926b623e8f19fb7fdb45d1b6146c7050) fix: guard onSpotifyPlayerReady with isHost check
- [`297fa7a`](https://github.com/Snoozyman/quefy/commit/297fa7a4a265a03b148754a142c7d853bed029c4) fix: stop destroying HLS stream on pause
- [`d6bd4e2`](https://github.com/Snoozyman/quefy/commit/d6bd4e2a050b1c664a3668aaa5b0dd98e77fcb49) fix: emit error when HLS is unsupported
- [`78e53a3`](https://github.com/Snoozyman/quefy/commit/78e53a38f150b27586cb851c7eab1f1196aa4fc4) fix: prevent duplicate error from HLS destruction
- [`90ad9d0`](https://github.com/Snoozyman/quefy/commit/90ad9d0695d37400a776881886db78f38cc04078) Merge pull request #7 from Snoozyman/bug-fix-audit
- [`38a29de`](https://github.com/Snoozyman/quefy/commit/38a29de7d9eeab4883364fb1cf5ab50cfb05360d) docs: update for SoundCloud, HLS, and recent fixes
- [`8b55c38`](https://github.com/Snoozyman/quefy/commit/8b55c38c03cd729942f0e4fedceb462934d5a42a) Merge pull request #8 from Snoozyman/docs/update
- [`1c6a0cc`](https://github.com/Snoozyman/quefy/commit/1c6a0cc3d53360b5f5a7cb973d883b7903072e8a) chore: update changelog for v0.2.0
- [`8d3e3fe`](https://github.com/Snoozyman/quefy/commit/8d3e3fe4e1ba661989ead88073c5ebf6988088ab) chore: update changelog for v0.2.0
## [0.2.0] - 2026-06-30

### Commits

- [`315434c`](https://github.com/Snoozyman/quefy/commit/315434c0ced4ea4d08a567aaf6b12868c3cab04f) fix: delete button show only if host
- [`e7a2907`](https://github.com/Snoozyman/quefy/commit/e7a29071057d9ae7c5086c560661c83bc11085b2) fix: room buttons
- [`75fa508`](https://github.com/Snoozyman/quefy/commit/75fa50845ab3fb616fc86eb58a5332ae7b540483) Merge pull request #2 from Snoozyman:bug-mobile-ui-layout
- [`dbd816b`](https://github.com/Snoozyman/quefy/commit/dbd816b2a012793ce4fd63b2bed46a41addfb16f) feat: SoundCloud support
- [`ccf847c`](https://github.com/Snoozyman/quefy/commit/ccf847cdb364a615c9e3ac9ae8ba4b96ba845ad5) feat: add HLS support for SoundCloud audio
- [`06405ff`](https://github.com/Snoozyman/quefy/commit/06405ffe79caba50991425af83f6682187106d7d) fix: better SoundCloud error handling and format fallback
- [`f656742`](https://github.com/Snoozyman/quefy/commit/f656742f0072eb736beea9bab8cd9588c17d0c34) Merge pull request #3 from Snoozyman:soundcloud-support
- [`a583e5e`](https://github.com/Snoozyman/quefy/commit/a583e5ebb89012278b4b2921c630b8e686baf92d) feat: add volume slider to Spotify player
- [`5187ae4`](https://github.com/Snoozyman/quefy/commit/5187ae42e5d16d150609cb640959e99004b28a90) fix: prevent multiple players from playing simultaneously
- [`5f67ca9`](https://github.com/Snoozyman/quefy/commit/5f67ca98def3ee12f32e023538af840ef4da05b0) Merge pull request #4 from Snoozyman/bug-fix-multiple-players
- [`551cce0`](https://github.com/Snoozyman/quefy/commit/551cce00d359067ff5bddb44f58d96da7a1ba76b) fix: hide Spotify player when current song is not spotify
- [`efa4846`](https://github.com/Snoozyman/quefy/commit/efa484688ec3ea3e750f9161d528429dccb9b5e4) fix: show SoundCloud search thumbnails
- [`63c6030`](https://github.com/Snoozyman/quefy/commit/63c6030967c26a2d3e7d5d3c539421103385a23a) Merge pull request #5 from Snoozyman/fix/spotify-player-hide
- [`34867b9`](https://github.com/Snoozyman/quefy/commit/34867b98710a2802e6f83144a64f8b4c57d8d0b9) Merge pull request #6 from Snoozyman/fix/soundcloud-thumbnails
- [`182ae41`](https://github.com/Snoozyman/quefy/commit/182ae418926b623e8f19fb7fdb45d1b6146c7050) fix: guard onSpotifyPlayerReady with isHost check
- [`297fa7a`](https://github.com/Snoozyman/quefy/commit/297fa7a4a265a03b148754a142c7d853bed029c4) fix: stop destroying HLS stream on pause
- [`d6bd4e2`](https://github.com/Snoozyman/quefy/commit/d6bd4e2a050b1c664a3668aaa5b0dd98e77fcb49) fix: emit error when HLS is unsupported
- [`78e53a3`](https://github.com/Snoozyman/quefy/commit/78e53a38f150b27586cb851c7eab1f1196aa4fc4) fix: prevent duplicate error from HLS destruction
- [`90ad9d0`](https://github.com/Snoozyman/quefy/commit/90ad9d0695d37400a776881886db78f38cc04078) Merge pull request #7 from Snoozyman/bug-fix-audit
- [`38a29de`](https://github.com/Snoozyman/quefy/commit/38a29de7d9eeab4883364fb1cf5ab50cfb05360d) docs: update for SoundCloud, HLS, and recent fixes
- [`8b55c38`](https://github.com/Snoozyman/quefy/commit/8b55c38c03cd729942f0e4fedceb462934d5a42a) Merge pull request #8 from Snoozyman/docs/update
- [`1c6a0cc`](https://github.com/Snoozyman/quefy/commit/1c6a0cc3d53360b5f5a7cb973d883b7903072e8a) chore: update changelog for v0.2.0
## [0.2.0] - 2026-06-30

### Commits

- [`315434c`](https://github.com/Snoozyman/quefy/commit/315434c0ced4ea4d08a567aaf6b12868c3cab04f) fix: delete button show only if host
- [`e7a2907`](https://github.com/Snoozyman/quefy/commit/e7a29071057d9ae7c5086c560661c83bc11085b2) fix: room buttons
- [`75fa508`](https://github.com/Snoozyman/quefy/commit/75fa50845ab3fb616fc86eb58a5332ae7b540483) Merge pull request #2 from Snoozyman:bug-mobile-ui-layout
- [`dbd816b`](https://github.com/Snoozyman/quefy/commit/dbd816b2a012793ce4fd63b2bed46a41addfb16f) feat: SoundCloud support
- [`ccf847c`](https://github.com/Snoozyman/quefy/commit/ccf847cdb364a615c9e3ac9ae8ba4b96ba845ad5) feat: add HLS support for SoundCloud audio
- [`06405ff`](https://github.com/Snoozyman/quefy/commit/06405ffe79caba50991425af83f6682187106d7d) fix: better SoundCloud error handling and format fallback
- [`f656742`](https://github.com/Snoozyman/quefy/commit/f656742f0072eb736beea9bab8cd9588c17d0c34) Merge pull request #3 from Snoozyman:soundcloud-support
- [`a583e5e`](https://github.com/Snoozyman/quefy/commit/a583e5ebb89012278b4b2921c630b8e686baf92d) feat: add volume slider to Spotify player
- [`5187ae4`](https://github.com/Snoozyman/quefy/commit/5187ae42e5d16d150609cb640959e99004b28a90) fix: prevent multiple players from playing simultaneously
- [`5f67ca9`](https://github.com/Snoozyman/quefy/commit/5f67ca98def3ee12f32e023538af840ef4da05b0) Merge pull request #4 from Snoozyman/bug-fix-multiple-players
- [`551cce0`](https://github.com/Snoozyman/quefy/commit/551cce00d359067ff5bddb44f58d96da7a1ba76b) fix: hide Spotify player when current song is not spotify
- [`efa4846`](https://github.com/Snoozyman/quefy/commit/efa484688ec3ea3e750f9161d528429dccb9b5e4) fix: show SoundCloud search thumbnails
- [`63c6030`](https://github.com/Snoozyman/quefy/commit/63c6030967c26a2d3e7d5d3c539421103385a23a) Merge pull request #5 from Snoozyman/fix/spotify-player-hide
- [`34867b9`](https://github.com/Snoozyman/quefy/commit/34867b98710a2802e6f83144a64f8b4c57d8d0b9) Merge pull request #6 from Snoozyman/fix/soundcloud-thumbnails
- [`182ae41`](https://github.com/Snoozyman/quefy/commit/182ae418926b623e8f19fb7fdb45d1b6146c7050) fix: guard onSpotifyPlayerReady with isHost check
- [`297fa7a`](https://github.com/Snoozyman/quefy/commit/297fa7a4a265a03b148754a142c7d853bed029c4) fix: stop destroying HLS stream on pause
- [`d6bd4e2`](https://github.com/Snoozyman/quefy/commit/d6bd4e2a050b1c664a3668aaa5b0dd98e77fcb49) fix: emit error when HLS is unsupported
- [`78e53a3`](https://github.com/Snoozyman/quefy/commit/78e53a38f150b27586cb851c7eab1f1196aa4fc4) fix: prevent duplicate error from HLS destruction
- [`90ad9d0`](https://github.com/Snoozyman/quefy/commit/90ad9d0695d37400a776881886db78f38cc04078) Merge pull request #7 from Snoozyman/bug-fix-audit
- [`38a29de`](https://github.com/Snoozyman/quefy/commit/38a29de7d9eeab4883364fb1cf5ab50cfb05360d) docs: update for SoundCloud, HLS, and recent fixes
- [`8b55c38`](https://github.com/Snoozyman/quefy/commit/8b55c38c03cd729942f0e4fedceb462934d5a42a) Merge pull request #8 from Snoozyman/docs/update
## [0.1.1] - 2026-06-30

### Commits

- [`1675dac`](https://github.com/Snoozyman/quefy/commit/1675dac71a59f54a6e6267c48ad48a707075125a) docs: add project overview and conventions to AGENTS.md
- [`9992c86`](https://github.com/Snoozyman/quefy/commit/9992c863dd6f90a8cb188f1e1aee5f60aec964c3) docs: add API response format to AGENTS.md
- [`8b83ac1`](https://github.com/Snoozyman/quefy/commit/8b83ac1cefb89d6094645c30d363aaf247b2abd0) docs: document ApiResponse/Result pattern from shared/utils/result.ts
- [`f3fc093`](https://github.com/Snoozyman/quefy/commit/f3fc093fe49ec571a876dc5e103d14b3eadd3faa) fix: let Nuxt auto-map env vars to runtimeConfig at runtime
- [`e30b075`](https://github.com/Snoozyman/quefy/commit/e30b075966307d6f0d7529087351ecbe92a78d94) feat: fetch Spotify client ID from server API at runtime
- [`7978f07`](https://github.com/Snoozyman/quefy/commit/7978f0746af7f7d53a7a37593537f109ff67d69b) docs: remove NUXT_PUBLIC_SPOTIFY_CLIENT_ID references
- [`a3d8840`](https://github.com/Snoozyman/quefy/commit/a3d88403fab68096c02a8772f3cd856a53413ebd) fix: prevent service worker from intercepting OAuth callbacks
- [`e583b4b`](https://github.com/Snoozyman/quefy/commit/e583b4b75d328a5811e75ffc41577978cd577e5c) fix(pwa): set navigateFallback to /app/overview to match PWA scope
- [`d3a8214`](https://github.com/Snoozyman/quefy/commit/d3a8214d80b62b0dd31e74564788fc1e94971557) fix: restructure SSE endpoint and fix event push signature
- [`ae1966e`](https://github.com/Snoozyman/quefy/commit/ae1966e1c4bb9d4f8995a293d3799f46c43eba27) fix: add SSE with poll fallback and dedup song change handling in room page
- [`d442922`](https://github.com/Snoozyman/quefy/commit/d442922600e748ff397e1d5550a680416a484b76) fix: suppress SSE error when page is navigating away for Spotify OAuth
- [`4631a33`](https://github.com/Snoozyman/quefy/commit/4631a33e262d84a1bb6f7fda940f7d158ba68c69) fix: add thumbnail field to Spotify search results and make search input visible
- [`f186de9`](https://github.com/Snoozyman/quefy/commit/f186de9847db41f8229f87d7341ee6cd09ad0074) fix: use bg-default instead of bg-background for search results
- [`26273f5`](https://github.com/Snoozyman/quefy/commit/26273f5cbdea09bd57d136a4fa57d8f0c8ee9151) chore: apply eslint formatting fixes
- [`16df733`](https://github.com/Snoozyman/quefy/commit/16df73399d0bfd576d329dd118f296cb8a7a4d30) chore: ignore session-*.md files
- [`9db801e`](https://github.com/Snoozyman/quefy/commit/9db801e9051f81125b5e5dc1afe7cb852a55f024) feat: add request logging middleware and detailed error logging to Spotify endpoints
- [`5a2129e`](https://github.com/Snoozyman/quefy/commit/5a2129e5ebd3329311b1f9d1cc64e40dcbcaa841) fix: remove broken workbox navigateFallback and handle Spotify 404 gracefully
- [`7d5c14f`](https://github.com/Snoozyman/quefy/commit/7d5c14f70cd2bc7d3e46d2b7b63029aa9443fa26) fix: await Spotify connect() and verify device registration succeeds
- [`8f58694`](https://github.com/Snoozyman/quefy/commit/8f58694576720ab224415e7474a711ae747c3d87) fix: verify Spotify device appears in API device list before declaring ready
- [`442758f`](https://github.com/Snoozyman/quefy/commit/442758ff9206314531ffcffedf48203b12f0b8fd) fix: match Spotify SDK snake_case property names for playback state
- [`fe50166`](https://github.com/Snoozyman/quefy/commit/fe5016669f41683d960c74dbed2d6d174fa1b3ef) fix: stop current Spotify playback before skip
- [`ae0b834`](https://github.com/Snoozyman/quefy/commit/ae0b8346006209f75b098aa1b531d892ac82a4b2) fix: tick position during Spotify playback to keep seek bar in sync
- [`f104f12`](https://github.com/Snoozyman/quefy/commit/f104f12ab82a580b6b5c18cce9f01722db5a5ed4) feat: expose current song via page title and Media Session API
- [`4a61105`](https://github.com/Snoozyman/quefy/commit/4a61105f6462021c680166c4a065d07c54344f83) fix: auto-skip when Spotify track ends naturally
- [`88134a8`](https://github.com/Snoozyman/quefy/commit/88134a8b418e436efa21f52bd9c11845a9e08157) fix: add YouTube video thumbnail as albumImageUrl for Media Session art
- [`b5cc09d`](https://github.com/Snoozyman/quefy/commit/b5cc09d50c53a31d563dedf0c3779635a6bfae6b) feat: show version and commit hash in sidebar footer
- [`68283d3`](https://github.com/Snoozyman/quefy/commit/68283d3fbc4b1a09bc7875404d49261768d66d19) feat: add GitHub icon linking to repo in both navbars
- [`0b2ef57`](https://github.com/Snoozyman/quefy/commit/0b2ef5710de6fb07b9c5d95520c691fc47759d96) fix: add pause to ytPlayerRef type to fix CI typecheck
- [`433ad04`](https://github.com/Snoozyman/quefy/commit/433ad0459cdf75cd891289f9e1d69e184324fd3b) fix: handle missing git in Docker build for commit hash
- [`eaa1764`](https://github.com/Snoozyman/quefy/commit/eaa176457238b4078694b791d450a8ab6726862f) fix: install git in Docker build stage for commit hash
- [`2ebb5c5`](https://github.com/Snoozyman/quefy/commit/2ebb5c5bf787b6b2481059d5010159db6fb8ff29) fix: remove .git from .dockerignore
- [`0628739`](https://github.com/Snoozyman/quefy/commit/0628739543b37501d6350fe23f70dbb756d1657f) fix: re-add navigateFallbackDenylist to prevent SW from intercepting OAuth callback
- [`deeac58`](https://github.com/Snoozyman/quefy/commit/deeac586b2c8746f8fc3ac9bfc011afbbb9f5063) fix: resume Spotify playback after idle periods (token refresh, remove ready check, drop device-list bailout)
- [`6e3a0d8`](https://github.com/Snoozyman/quefy/commit/6e3a0d889e32d40cd7eef37e05d8a7e2e272967a) feat: redesign landing page with hero, features, how-it-works, CTA
- [`4e235b4`](https://github.com/Snoozyman/quefy/commit/4e235b4171714dad9c1505fa795796c2735b10fa) feat: enhance room index page layout with inline input and button row
- [`723f01c`](https://github.com/Snoozyman/quefy/commit/723f01c611903d3e56244efdee95c87082e36dd1) fix: rework Spotify playback logic — skip, toggle, transfer, track-end detection
- [`6f4d83a`](https://github.com/Snoozyman/quefy/commit/6f4d83a1dad8b1c4acc0828940267bd48d30b3f9) feat: stateless host verification and token-in-URL OAuth flow
- [`4f1b4ce`](https://github.com/Snoozyman/quefy/commit/4f1b4ce644b0a65088b8f2944aa8ae8cb119600c) refactor: replace node-tls-client with curl for cookie fetching
- [`57bfa68`](https://github.com/Snoozyman/quefy/commit/57bfa68d19c370a1076d154f8b3d77fe4d49eb37) feat: add room deletion endpoint and deleteRoom utility
- [`d9ae50e`](https://github.com/Snoozyman/quefy/commit/d9ae50e486e24b174e7fce256407321bcfd60bee) feat: add YouTube audio duration field and reject zero-length streams
- [`25fbf01`](https://github.com/Snoozyman/quefy/commit/25fbf0189edd99420f477636b6ba742031576cdd) chore: update nuxt config, app layout, PWA settings, and fix file endings
- [`ac2a7f3`](https://github.com/Snoozyman/quefy/commit/ac2a7f3cb912629135dba10df5df4cc82b4212c3) fix: improve YouTube player resilience and expose pause method
## [0.1.0] - 2026-06-17

### Commits

- [`fe84485`](https://github.com/Snoozyman/quefy/commit/fe8448561ea26ab0545de95cc9d17460e96d36a2) Update README.md
- [`4ca7d6b`](https://github.com/Snoozyman/quefy/commit/4ca7d6b4e1e59f50fd7348fd71115a7778e0b2cc) update: version control
- [`a404f27`](https://github.com/Snoozyman/quefy/commit/a404f27e0da95943b161f16c3d8386f260a05861) ci: add nightly docker workflow with commit hash tagging
- [`897fb1b`](https://github.com/Snoozyman/quefy/commit/897fb1bcdc4980e4852e45d87afb4b52869744d7) Update nightly-docker.yml
- [`56b94e6`](https://github.com/Snoozyman/quefy/commit/56b94e6ee1d74d15ed51b2622033f6b9ce95cf78) update to use PORT env
- [`aa42536`](https://github.com/Snoozyman/quefy/commit/aa4253636661e4a01929abdb551cd02c61c86600) fix: dashboard layout, mobile sidebar, hide global header on /app routes
- [`b1b72ca`](https://github.com/Snoozyman/quefy/commit/b1b72cad18dc9e9117375f892429bdf12a095b4c) fix: scope to pwa
- [`44f8fc0`](https://github.com/Snoozyman/quefy/commit/44f8fc06acb6a9b081979e22f5a4da1ab438399c) chore: lint and format
- [`5877008`](https://github.com/Snoozyman/quefy/commit/5877008657ef12161b645d1fd062570ec7802f41) feat: add Spotify search, OAuth, and Web Playback SDK
- [`a80150c`](https://github.com/Snoozyman/quefy/commit/a80150c559c92a4340150677bf46f03a10f0b517) refactor: extract room page into focused components
- [`64ea6ac`](https://github.com/Snoozyman/quefy/commit/64ea6acda51019d568d886cafcb80a450f4c647f) feat: browser cookie upload for yt-dlp authentication
- [`2c33493`](https://github.com/Snoozyman/quefy/commit/2c334931581cc82f911b5e270baa9ee53ae8205b) docs: update README, Docker docs, and env vars
- [`6cb2d71`](https://github.com/Snoozyman/quefy/commit/6cb2d719080cc0e20eada4fa18b10ff922396c64) ci: add release workflow triggered by v* tags
- [`027c379`](https://github.com/Snoozyman/quefy/commit/027c379186f48a82e4626eb668bafd044be634c4) fix: volume mute toggle, typo, room cleanup, and docs
- [`13a867a`](https://github.com/Snoozyman/quefy/commit/13a867a18776ae580775af9014ee36c32390944f) Merge pull request #1 from Snoozyman/feat/spotify-and-cookies

## [0.0.2] - 2026-06-16

### Commits

- [`12eeb0b`](https://github.com/Snoozyman/quefy/commit/12eeb0b59cf8d7c7c260ecdfc99b92103aec2f8e) fix: use yt-dlp_linux binary in Dockerfile, update docker docs
