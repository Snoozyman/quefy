import { watch, type Ref } from 'vue'
import type { RoomState, SongData } from '#shared/types/room'
import {
  destroyMediaSessionAnchor,
  setMediaSessionAnchor,
  setMediaSessionAnchorHooks,
  syncMediaSessionAnchor
} from '../utils/media-session-anchor'
import type { AudioPlayerHandle, SpotifyPlayerLike } from './types'

export interface MediaSessionDeps {
  roomState: Ref<RoomState>
  isHost: Readonly<Ref<boolean>>
  audio: () => AudioPlayerHandle | undefined
  spotify: SpotifyPlayerLike
  onPlay: () => void
  onPause: () => void
  onNext: () => void
}

/**
 * Keeps the page title and the OS media controls (lock screen, KDE/MPRIS,
 * Chrome's media hub) showing the current song, and routes their buttons
 * back into the room.
 *
 * Spotify plays inside the SDK's iframe, which widgets would otherwise show
 * as "Spotify Embedded Player"; a silent "anchor" element in this page,
 * matched to the track's length and position, keeps our metadata in front.
 */
export function useMediaSession(deps: MediaSessionDeps) {
  const { roomState, isHost, spotify } = deps
  const hasMediaSession = () =>
    typeof navigator !== 'undefined' && 'mediaSession' in navigator

  function seekCurrent(seconds: number, song: SongData) {
    if (song.source === 'spotify') void spotify.seek(Math.round(seconds * 1000))
    else deps.audio()?.seek(seconds)
  }

  function updateMetadata(song: SongData | null) {
    if (typeof document !== 'undefined') {
      document.title = song
        ? `${song.title} — ${song.artists?.join(', ') || song.addedBy} — Quefy`
        : 'Quefy'
    }
    if (!hasMediaSession()) return
    const session = navigator.mediaSession
    if (!song) {
      session.metadata = null
      session.playbackState = 'none'
      return
    }
    session.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artists?.join(', ') || song.addedBy,
      album: song.albumName || '',
      // No `type`: covers are JPEG (Spotify) or WebP/JPEG (YouTube), and a
      // wrong type can make widgets skip the image.
      artwork: song.albumImageUrl ? [{ src: song.albumImageUrl }] : []
    })
    session.playbackState = roomState.value.isPlaying ? 'playing' : 'paused'
    session.setActionHandler('play', () => {
      if (!roomState.value.isPlaying) deps.onPlay()
    })
    session.setActionHandler('pause', () => {
      if (roomState.value.isPlaying) deps.onPause()
    })
    session.setActionHandler('nexttrack', () => deps.onNext())
    session.setActionHandler('previoustrack', () => seekCurrent(0, song))
    session.setActionHandler('seekto', (details) =>
      seekCurrent(details.seekTime ?? 0, song)
    )
  }

  function updatePlaybackState() {
    if (!hasMediaSession()) return
    navigator.mediaSession.playbackState = !roomState.value.currentSong
      ? 'none'
      : roomState.value.isPlaying
        ? 'playing'
        : 'paused'
  }

  function updatePosition(song: SongData | null) {
    if (!song || !hasMediaSession()) return
    const session = navigator.mediaSession as MediaSession & {
      setPositionState?: (state: MediaPositionState) => void
    }
    if (!session.setPositionState) return
    const audio = deps.audio()
    const duration =
      song.source === 'spotify'
        ? spotify.duration.value / 1000
        : (audio?.state.duration.value ?? 0)
    const position =
      song.source === 'spotify'
        ? spotify.position.value / 1000
        : (audio?.state.currentTime.value ?? 0)
    if (!isFinite(duration) || duration <= 0) return
    session.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(Math.max(0, position), duration)
    })
  }

  // --- Spotify anchor -----------------------------------------------------

  const anchorTiming = () => ({
    durationMs: spotify.duration.value,
    positionMs: spotify.position.value
  })
  const anchorActive = () =>
    isHost.value &&
    roomState.value.currentSong?.source === 'spotify' &&
    !spotify.paused.value

  // Widgets follow the most recently started player. The Spotify frame
  // (re)starts its audio a moment after it reports playing: on resume, on a
  // new track, and when a stuck start is re-sent. Restart the anchor after
  // each of those so it stays the newest.
  let reassertTimer: ReturnType<typeof setTimeout> | undefined
  function reassertAnchorSoon() {
    clearTimeout(reassertTimer)
    reassertTimer = setTimeout(() => {
      if (anchorActive()) {
        setMediaSessionAnchor(true, { ...anchorTiming(), restart: true })
      }
    }, 1500)
  }

  /**
   * KDE's browser integration controls the anchor element itself rather
   * than calling Media Session handlers, and reads metadata when a player
   * starts: route both back. Call on mount, so a previous room page's
   * cleanup can't clear the hooks.
   */
  function registerAnchorHooks() {
    setMediaSessionAnchorHooks({
      // Widgets register a new player slightly after it starts; re-send the
      // metadata then (cleared first so it counts as a change).
      onPlaying: () =>
        setTimeout(() => {
          if (hasMediaSession()) navigator.mediaSession.metadata = null
          updateMetadata(roomState.value.currentSong)
        }, 500),
      onExternalPause: () => {
        if (roomState.value.isPlaying) deps.onPause()
      },
      onExternalPlay: () => {
        if (!roomState.value.isPlaying) deps.onPlay()
      },
      onExternalSeek: (seconds) => {
        if (roomState.value.currentSong?.source !== 'spotify') return
        void spotify.seek(Math.round(seconds * 1000))
      }
    })
  }

  watch(
    () => roomState.value.currentSong,
    (song) => {
      updateMetadata(song)
      updatePosition(song)
    },
    { immediate: true }
  )
  watch(() => roomState.value.isPlaying, updatePlaybackState)
  watch(
    () => [
      spotify.position.value,
      spotify.duration.value,
      deps.audio()?.state.currentTime.value,
      deps.audio()?.state.duration.value
    ],
    () => updatePosition(roomState.value.currentSong)
  )
  watch(
    anchorActive,
    (active) => {
      setMediaSessionAnchor(active, anchorTiming())
      if (active) updateMetadata(roomState.value.currentSong)
    },
    { immediate: true }
  )
  // Widgets show the anchor's length/progress: keep it matching Spotify's.
  watch(
    () => [spotify.duration.value, spotify.position.value] as const,
    ([durationMs, positionMs]) => {
      if (roomState.value.currentSong?.source !== 'spotify') return
      syncMediaSessionAnchor(durationMs, positionMs)
    }
  )
  watch(
    () => [spotify.currentTrack.value?.uri, spotify.paused.value] as const,
    ([uri, paused], [prevUri, prevPaused]) => {
      if (paused || !uri) return
      if (uri !== prevUri || prevPaused) reassertAnchorSoon()
    }
  )

  function dispose() {
    clearTimeout(reassertTimer)
    destroyMediaSessionAnchor()
  }

  return { registerAnchorHooks, dispose }
}
