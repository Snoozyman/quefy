/**
 * Shared shapes for the host's playback modules. They take their
 * dependencies (players, room API) as arguments rather than calling Nuxt
 * composables or `$fetch`, so they can run under `bun test` with fakes.
 * `#shared/*` resolves in Nuxt through its alias and under `bun test`
 * through the `imports` field in package.json.
 */
import type { Ref } from 'vue'
import type { SongData } from '#shared/types/room'

/** What AudioPlayer.vue exposes (YouTube / SoundCloud via `<audio>`). */
export interface AudioPlayerHandle {
  play: (url: string, startTime?: number) => void
  pause: (opts?: { keepAlive?: boolean }) => void
  resume: () => void
  seek: (time: number) => void
  unlockSilentAudio: () => void
  state: {
    playing: { value: boolean }
    currentTime: { value: number }
    duration: { value: number }
  }
}

/** The part of useSpotifyPlayer() that playback uses. */
export interface SpotifyPlayerLike {
  deviceId: Readonly<Ref<string>>
  paused: Readonly<Ref<boolean>>
  /** Milliseconds; writable so a start can show its position immediately. */
  position: Ref<number>
  /** Milliseconds. */
  duration: Readonly<Ref<number>>
  currentTrack: Readonly<Ref<{ uri: string } | null | undefined>>
  play: () => Promise<void>
  pause: () => Promise<void>
  seek: (positionMs: number) => Promise<void> | void
  setOnTrackEnd: (cb: (() => void) | null) => void
  resetErrors: () => void
}

/** Where a song's stream URL is resolved from. */
export type AudioSource = { videoId: string } | { trackUrl: string }

export interface PlayStateResponse {
  isPlaying: boolean
  currentSong: SongData | null
}

/** Host-only room API calls (the host token is added by the implementation). */
export interface PlaybackApi {
  togglePlay: () => Promise<PlayStateResponse>
  skip: () => Promise<PlayStateResponse>
  refreshAudio: (
    source: AudioSource
  ) => Promise<{ url: string; title: string; durationMs: number }>
  reportPosition: (positionMs: number) => Promise<unknown>
}

export function isAudioSong(
  song: SongData | null | undefined
): song is SongData {
  return song?.source === 'youtube' || song?.source === 'soundcloud'
}

export function audioSource(song: SongData): AudioSource | null {
  if (song.videoId) return { videoId: song.videoId }
  if (song.trackUrl) return { trackUrl: song.trackUrl }
  return null
}
