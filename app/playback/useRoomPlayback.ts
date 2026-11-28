import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { RoomState, SongData } from '#shared/types/room'
import { errorMessage } from '#shared/utils/error'
import { createPrefetcher, type PrefetchStatus } from './prefetch'
import type { SpotifyStartOptions } from './spotifyStart'
import {
  audioSource,
  isAudioSong,
  type AudioPlayerHandle,
  type PlaybackApi,
  type SpotifyPlayerLike
} from './types'

/**
 * Prefetch the next stream once the current song has played this long (so
 * rapid skipping doesn't fire requests), or near its end at the latest.
 */
export const PREFETCH_AFTER_S = 5
export const PREFETCH_LEAD_S = 30
/** Automatic stream refreshes per song before asking the user. */
export const RETRY_LIMIT = 2

export interface RoomPlaybackDeps {
  roomState: Ref<RoomState>
  isHost: Readonly<Ref<boolean>>
  /** Present when this browser holds the room's host token. */
  hasHostToken: () => boolean
  error: Ref<string>
  audio: () => AudioPlayerHandle | undefined
  spotify: SpotifyPlayerLike
  startSpotify: (trackUri: string, options?: SpotifyStartOptions) => Promise<void>
  api: PlaybackApi
  /** The user has interacted with the page (autoplay is allowed). */
  userActivated: Readonly<Ref<boolean>>
}

type RefreshResult = 'played' | 'stale' | 'exhausted' | 'failed' | 'busy'

/**
 * The host's playback: starts each song on the right player (Spotify SDK or
 * `<audio>`), keeps the room's play state, skip and position in step with
 * what this device plays, and recovers from expired stream URLs.
 */
export function useRoomPlayback(deps: RoomPlaybackDeps) {
  const { roomState, isHost, error, spotify, api } = deps

  const canControl = () => isHost.value && deps.hasHostToken()

  let skipping = false
  let lastSongId: string | null = null
  let currentPlayingId = ''
  let lastKnownPosition = 0
  const retryCount = new Map<string, number>()
  const refreshingAudio = ref(false)
  const retryExhausted = ref(false)
  /**
   * The audio song this device is starting (resolving its URL, waiting for
   * YouTube's activation delay, buffering). Cleared once audio plays.
   */
  const loadingSongId = ref<string | null>(null)

  const prefetcher = createPrefetcher({
    next: () => roomState.value.queue[0],
    enabled: canControl,
    refresh: (source) => api.refreshAudio(source)
  })

  const audioLoading = computed(
    () =>
      !!loadingSongId.value &&
      loadingSongId.value === roomState.value.currentSong?.id
  )

  /** Status badge for the next song only (host only; others don't prefetch). */
  const upNextStatus = computed<Record<string, PrefetchStatus>>(() => {
    const next = roomState.value.queue[0]
    if (!isHost.value || !isAudioSong(next)) return {}
    const status =
      prefetcher.status.value[next.id] ?? (next.url ? 'ready' : undefined)
    return status ? { [next.id]: status } : {}
  })

  /** Mark `song` as starting on this device, if it is an audio song. */
  function markLoading(song: SongData | null | undefined) {
    loadingSongId.value =
      isAudioSong(song) && roomState.value.isPlaying ? song.id : null
  }

  /** Room position in seconds, or undefined at the start. */
  function roomStartTime(): number | undefined {
    return roomState.value.position > 0
      ? roomState.value.position / 1000
      : undefined
  }

  /** Where to resume after a refresh: the live audio position, else the room's. */
  function resumeTimeSeconds(): number | undefined {
    const live = deps.audio()?.state.currentTime.value ?? 0
    return live > 0 ? live : roomStartTime()
  }

  /**
   * The one place that re-resolves a song's stream URL (YouTube / SoundCloud
   * URLs expire) and starts playback. Automatic retries are capped per song;
   * a manual refresh always tries and resets the cap on success.
   */
  async function refreshAndPlay(
    song: SongData,
    { manual = false, play = true }: { manual?: boolean; play?: boolean } = {}
  ): Promise<RefreshResult> {
    if (refreshingAudio.value) return 'busy'
    const source = audioSource(song)
    if (!source || !deps.hasHostToken()) return 'failed'

    const attempts = retryCount.get(song.id) ?? 0
    if (!manual && attempts >= RETRY_LIMIT) {
      retryExhausted.value = true
      error.value = `Failed to load audio after ${RETRY_LIMIT} attempts.`
      return 'exhausted'
    }

    refreshingAudio.value = true
    if (!manual) retryCount.set(song.id, attempts + 1)
    try {
      const refreshed = await api.refreshAudio(source)
      if (roomState.value.currentSong?.id !== song.id) return 'stale'

      retryCount.delete(song.id)
      retryExhausted.value = false
      error.value = ''
      song.url = refreshed.url
      prefetcher.remember(song.id, refreshed.url)
      if (!song.title || song.title === 'Unknown Title') song.title = refreshed.title
      if (!song.durationMs) song.durationMs = refreshed.durationMs

      if (play) {
        const startTime = resumeTimeSeconds()
        void nextTick(() => {
          // Paused while the URL was resolving: don't start it.
          if (roomState.value.currentSong?.id !== song.id) return
          if (!roomState.value.isPlaying) return
          deps.audio()?.play(refreshed.url, startTime)
        })
      }
      return 'played'
    } catch (err: unknown) {
      error.value = `Could not load audio for "${song.title}": ${errorMessage(err)}`
      if (manual) {
        retryCount.set(song.id, RETRY_LIMIT)
        retryExhausted.value = true
      }
      return 'failed'
    } finally {
      refreshingAudio.value = false
    }
  }

  /** Start `song` on this device: the song the room just moved to. */
  async function handleSongChange(song: SongData) {
    if (!isHost.value) return
    if (song.id === currentPlayingId) return
    currentPlayingId = song.id
    markLoading(song)
    if (isAudioSong(song) && !song.url) {
      const prefetched = await prefetcher.resolvePending(song)
      if (song.id !== currentPlayingId) return
      if (prefetched) song.url = prefetched
    }
    try {
      if (song.source === 'spotify' && song.trackUri) {
        deps.audio()?.pause()
        spotify.setOnTrackEnd(skip)
        await deps.startSpotify(song.trackUri)
        return
      }
      if (!isAudioSong(song)) return

      if (!song.url && !audioSource(song)) {
        void skip()
        return
      }
      spotify.setOnTrackEnd(null)
      spotify.resetErrors()
      await spotify.pause()
      if (song.id !== currentPlayingId || !roomState.value.isPlaying) return

      if (song.url) {
        const url = song.url
        const startTime = roomStartTime()
        void nextTick(() => {
          if (song.id !== currentPlayingId || !roomState.value.isPlaying) return
          deps.audio()?.play(url, startTime)
        })
      } else {
        const result = await refreshAndPlay(song)
        if (result === 'failed') void skip()
      }
    } catch (err: unknown) {
      error.value = `Song change failed: ${errorMessage(err)}`
      void skip()
    }
  }

  /** Whether this device is actually producing the current song right now. */
  function isPlayingLocally(song: SongData): boolean {
    if (song.source === 'spotify') {
      return (
        !spotify.paused.value &&
        spotify.currentTrack.value?.uri === song.trackUri
      )
    }
    return deps.audio()?.state.playing.value ?? false
  }

  /** Resume (or start) an audio song on this device at the room position. */
  function resumeAudio(song: SongData) {
    const audio = deps.audio()
    const url = prefetcher.knownUrl(song)
    if ((audio?.state.duration.value ?? 0) > 0) {
      audio?.resume()
    } else if (url) {
      markLoading(song)
      audio?.play(url, roomStartTime())
    } else {
      // No URL yet (e.g. live state replaced the song object): resolve it.
      currentPlayingId = ''
      void handleSongChange(song)
    }
  }

  /** Resume a Spotify song on this device, re-sending it if the SDK lost it. */
  function resumeSpotify(trackUri: string) {
    deps.audio()?.pause()
    if (spotify.currentTrack.value?.uri === trackUri) void spotify.play()
    else void deps.startSpotify(trackUri)
  }

  /** Start the current song on this device without changing room state. */
  function resumeLocally(song: SongData) {
    error.value = ''
    if (song.source === 'spotify' && song.trackUri) resumeSpotify(song.trackUri)
    else resumeAudio(song)
  }

  async function togglePlay() {
    if (!canControl()) return
    const current = roomState.value.currentSong
    // The room says "playing" but nothing plays here (autoplay was blocked,
    // or the page just loaded): Play should start it, not pause the room.
    // While a song is still loading, the button is Pause.
    if (
      current &&
      roomState.value.isPlaying &&
      !audioLoading.value &&
      !isPlayingLocally(current)
    ) {
      resumeLocally(current)
      return
    }
    const prevSongId = current?.id
    try {
      const res = await api.togglePlay()
      roomState.value.isPlaying = res.isPlaying
      if (res.currentSong) roomState.value.currentSong = res.currentSong

      if (!res.isPlaying) {
        void spotify.pause()
        deps.audio()?.pause()
        return
      }
      const song = res.currentSong
      // A new song (play from idle) is started by the currentSong watcher.
      if (!song || song.id !== prevSongId) return
      if (song.source === 'spotify' && song.trackUri) {
        resumeSpotify(song.trackUri)
      } else if (isAudioSong(song)) {
        void spotify.pause()
        resumeAudio(song)
      }
    } catch (err: unknown) {
      error.value = `Playback failed: ${errorMessage(err)}`
    }
  }

  async function skip(
    { localAlreadyPlaying = false }: { localAlreadyPlaying?: boolean } = {}
  ) {
    if (!canControl() || skipping) return
    skipping = true

    // Keep the iOS audio session alive through the track change.
    if (!localAlreadyPlaying) deps.audio()?.pause({ keepAlive: true })

    try {
      const res = await api.skip()
      roomState.value.position = 0
      roomState.value.isPlaying = res.isPlaying

      if (localAlreadyPlaying && res.currentSong?.id === currentPlayingId) {
        // We already started this song locally; just adopt the server copy.
        lastSongId = res.currentSong.id
        res.currentSong.url ??= roomState.value.currentSong?.url
        roomState.value.currentSong = res.currentSong
        return
      }

      if (res.currentSong) lastSongId = res.currentSong.id
      roomState.value.currentSong = res.currentSong
      if (res.currentSong) {
        void handleSongChange(res.currentSong)
      } else {
        // Queue finished: now it's fine to release the audio session.
        deps.audio()?.pause()
        void spotify.pause()
      }
    } catch (err: unknown) {
      error.value = `Failed to skip: ${errorMessage(err)}`
    } finally {
      skipping = false
    }
  }

  /**
   * Track finished. If the next song is audio and its URL is already known
   * (prefetched), start it immediately from this event and tell the server
   * afterwards. Waiting for the network first leaves a silent gap in which a
   * locked phone may suspend the page.
   */
  function onAudioEnded() {
    const next = roomState.value.queue[0]
    const url = isAudioSong(next) ? prefetcher.knownUrl(next) : undefined
    if (!next || !url || !roomState.value.isPlaying || skipping) {
      void skip()
      return
    }

    next.url = url
    currentPlayingId = next.id
    lastSongId = next.id
    roomState.value.position = 0
    roomState.value.queue = roomState.value.queue.slice(1)
    roomState.value.currentSong = next
    spotify.setOnTrackEnd(null)
    markLoading(next)
    void nextTick(() => deps.audio()?.play(url))
    void skip({ localAlreadyPlaying: true })
  }

  /** Autoplay was blocked: reflect that the room is not playing here. */
  async function onPlayBlocked() {
    if (!canControl()) return
    try {
      const res = await api.togglePlay()
      roomState.value.isPlaying = res.isPlaying
    } catch {
      // background sync; the Play button still works
    }
  }

  /** The `<audio>` element failed or its URL expired: refresh and retry. */
  async function recoverAudio(message?: string) {
    if (refreshingAudio.value) return
    if (message) error.value = message
    const song = roomState.value.currentSong
    if (!song) return skip()
    const result = await refreshAndPlay(song, { play: deps.userActivated.value })
    if (result === 'failed') await skip()
  }

  async function manualRefreshAudio() {
    const song = roomState.value.currentSong
    if (!song) return
    retryExhausted.value = false
    await refreshAndPlay(song, { manual: true })
  }

  /** Play/pause from OS media controls: act locally, then sync the room. */
  function mediaPlay() {
    const song = roomState.value.currentSong
    if (!song) return
    roomState.value.isPlaying = true
    if (song.source === 'spotify') spotify.play().catch(() => {})
    else deps.audio()?.resume()
    if (canControl()) api.togglePlay().catch(() => {})
  }

  function mediaPause() {
    const song = roomState.value.currentSong
    if (!song) return
    roomState.value.isPlaying = false
    if (song.source === 'spotify') spotify.pause().catch(() => {})
    else deps.audio()?.pause()
    if (canControl()) api.togglePlay().catch(() => {})
  }

  /** The Spotify SDK connected: resume a Spotify song the room is playing. */
  function onSpotifyReady() {
    spotify.setOnTrackEnd(skip)
    const song = roomState.value.currentSong
    if (song?.source === 'spotify' && song.trackUri && roomState.value.isPlaying) {
      deps.audio()?.pause()
      void deps.startSpotify(song.trackUri)
    }
  }

  /** Send this device's position to the room (called every few seconds). */
  function reportPosition() {
    if (!canControl()) return
    const song = roomState.value.currentSong
    if (!song || !isPlayingLocally(song)) return
    const position =
      song.source === 'spotify'
        ? spotify.position.value
        : Math.round((deps.audio()?.state.currentTime.value ?? 0) * 1000)
    lastKnownPosition = position
    if (position > 0) api.reportPosition(position).catch(() => {})
  }

  // Start each new song on this device.
  watch(
    () => roomState.value.currentSong,
    (song) => {
      if (!song || !isHost.value || song.id === lastSongId) return
      lastSongId = song.id
      void handleSongChange(song)
    }
  )

  // Prefetch the next stream while an audio or a Spotify song plays.
  watch(
    () => deps.audio()?.state.currentTime.value ?? 0,
    (t) => {
      const d = deps.audio()?.state.duration.value ?? 0
      if (d > 0 && (t >= PREFETCH_AFTER_S || d - t <= PREFETCH_LEAD_S)) {
        void prefetcher.prefetchNext()
      }
    }
  )
  watch(
    () => spotify.position.value,
    (ms) => {
      if (roomState.value.currentSong?.source !== 'spotify') return
      const d = spotify.duration.value
      if (d > 0 && (ms >= PREFETCH_AFTER_S * 1000 || d - ms <= PREFETCH_LEAD_S * 1000)) {
        void prefetcher.prefetchNext()
      }
    }
  )

  // Forget prefetched URLs for songs that left the queue.
  watch(
    () => roomState.value.queue.map((s) => s.id),
    (ids) => prefetcher.retain(ids, roomState.value.currentSong?.id)
  )

  // The loading state ends when audio actually plays, the room stops (pause,
  // blocked autoplay), or an error is shown.
  watch(
    () => deps.audio()?.state.playing.value,
    (playing) => {
      if (playing) loadingSongId.value = null
    }
  )
  watch(
    () => [roomState.value.isPlaying, error.value] as const,
    ([playing, err]) => {
      if (!playing || err) loadingSongId.value = null
    }
  )

  return {
    audioLoading,
    upNextStatus,
    refreshingAudio,
    retryExhausted,
    togglePlay,
    skip,
    onAudioEnded,
    onAudioError: (message: string) => recoverAudio(message),
    onAudioExpired: () => recoverAudio(),
    onPlayBlocked,
    manualRefreshAudio,
    mediaPlay,
    mediaPause,
    onSpotifyReady,
    reportPosition,
    lastKnownPosition: () => lastKnownPosition
  }
}

export type RoomPlayback = ReturnType<typeof useRoomPlayback>
