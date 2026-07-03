# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
