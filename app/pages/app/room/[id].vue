<template>
  <div
    v-if="loading"
    class="max-w-2xl mx-auto space-y-6 py-12 text-center text-muted"
  >
    Loading room...
  </div>
  <div
    v-else-if="notFound"
    class="max-w-lg mx-auto py-16 text-center space-y-4"
  >
    <UIcon name="i-lucide-door-open" class="size-12 text-muted" />
    <h2 class="text-lg font-semibold">Room not found</h2>
    <p class="text-sm text-muted">
      This room may have expired or the code is incorrect.
    </p>
    <UButton to="/app/room" variant="outline"> Back to Rooms </UButton>
  </div>
  <div v-else class="h-dvh overflow-y-auto pb-16">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <RoomHeader
        :room-id="roomId"
        :room-state="roomState"
        :is-host="isHost"
        class="mb-6"
        @settings="settingsOpen = true"
      />

      <div
        class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]"
      >
        <div class="flex min-w-0 flex-col gap-4">
          <RoomSpotifyPlayer
            :show="showSpotifyPlayer"
            :track="spotifyPlayer.currentTrack.value ?? fallbackTrack"
            :paused="spotifyPlayer.paused.value"
            :position="spotifyPlayer.position.value"
            :duration="spotifyPlayer.duration.value"
            @toggle="togglePlay"
            @skip="skip"
            @seek="(v: number) => spotifyPlayer.seek(v)"
          />

          <RoomAudioPlayer
            ref="audioPlayerRef"
            :show="showAudioPlayer"
            :current-song="roomState.currentSong"
            :is-playing="roomState.isPlaying"
            :loading="audioLoading"
            @toggle="togglePlay"
            @skip="skip"
            @ended="onAudioEnded"
            @error="(msg: string) => onAudioError(msg)"
            @expired="onAudioExpired"
            @play-blocked="onPlayBlocked"
          />

          <RoomNowPlaying
            v-if="!showSpotifyPlayer && !showAudioPlayer"
            :song="roomState.currentSong"
            :is-playing="roomState.isPlaying"
            :controllable="isHost"
            :toggle-disabled="playDisabled"
            :empty-title="
              roomState.queue.length && isHost
                ? 'Press play to start the queue'
                : 'Add a song to get started'
            "
            :hint="isHost ? '' : 'The host controls playback.'"
            @toggle="togglePlay"
            @skip="skip"
          />

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :description="error"
            closable
            @close="error = ''; retryExhausted = false"
          >
            <template v-if="retryExhausted" #actions>
              <div class="flex gap-2">
                <UButton
                  size="xs"
                  color="error"
                  variant="outline"
                  icon="i-lucide-refresh-cw"
                  :loading="refreshingAudio"
                  @click="manualRefreshAudio"
                >
                  Refresh
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  variant="outline"
                  icon="i-lucide-skip-forward"
                  @click="error = ''; retryExhausted = false; skip()"
                >
                  Skip
                </UButton>
              </div>
            </template>
          </UAlert>

          <RoomSpotifyConnectBanner
            :room-id="roomId"
            @player-ready="onSpotifyPlayerReady"
          />

          <RoomSongSearch
            :room-id="roomId"
            :adding-song="addingSong"
            :spotify-connected="roomState.spotifyConnected"
            @add-youtube="addSongByVideoId"
            @add-spotify="addSpotifyTrack"
            @add-soundcloud="addSongBySoundcloudUrl"
          />
        </div>

        <aside class="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <RoomSongQueue
            :queue="roomState.queue"
            :is-host="isHost"
            :prefetch-status="upNextStatus"
            @remove="removeSong"
            @reorder="reorderQueue"
          />
        </aside>
      </div>
    </div>

    <USlideover
      v-model:open="settingsOpen"
      title="Room settings"
      :description="isHost ? 'You are the host of this room.' : 'You are a guest in this room.'"
    >
      <template #body>
        <RoomSettingsTab
          :is-host="isHost"
          :room-id="roomId"
          :host-token="hostData?.hostToken"
          @import="openImport"
          @export="exportQueue"
          @delete="deleteRoom"
        />
      </template>
    </USlideover>

    <RoomImportDialog
      v-if="isHost && hostData?.hostToken"
      v-model:open="showImportDialog"
      :room-id="roomId"
      :host-token="hostData.hostToken"
      @imported="fetchRoomState"
    />
  </div>
</template>

<script lang="ts" setup>
import type { SongData } from '#shared/types/room'
import { errorMessage } from '#shared/utils/error'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const {
  roomState,
  loading,
  notFound,
  error,
  isHost,
  hostData,
  fetchRoomState
} = useRoomState(computed(() => roomId))
const spotifyAuth = useSpotifyAuth()
const spotifyPlayer = useSpotifyPlayer()

const addingSong = ref(false)
const showImportDialog = ref(false)
const settingsOpen = ref(false)

function openImport() {
  settingsOpen.value = false
  showImportDialog.value = true
}

const playDisabled = computed(
  () => !roomState.value.queue.length && !roomState.value.currentSong
)
const showSpotifyPlayer = computed(
  () =>
    isHost.value &&
    roomState.value.currentSong?.source === 'spotify' &&
    spotifyPlayer.isReady.value &&
    !!spotifyPlayer.currentTrack.value &&
    spotifyPlayer.currentTrack.value.uri === roomState.value.currentSong.trackUri
)
const showAudioPlayer = computed(
  () => isHost.value && currentSongIsAudio.value
)
const currentSongIsAudio = computed(
  () =>
    roomState.value.currentSong?.source === 'youtube' ||
    roomState.value.currentSong?.source === 'soundcloud'
)

const audioPlayerRef = ref<{
  play: (url: string, startTime?: number) => void
  pause: (opts?: { keepAlive?: boolean }) => void
  resume: () => void
  seek: (time: number) => void
  unlockSilentAudio: () => void
  state: {
    playing: { value: boolean }
    currentTime: { value: number }
    duration: { value: number }
    volume: { value: number }
    seekValue: { value: number }
  }
}>()

const userActivated = ref(false)
let userActivateDone = false

/**
 * Browsers only let the Spotify SDK start audio after it was "activated"
 * inside a user gesture. The player may not exist at the first click, so do
 * this on every click/key (capture phase = still inside the gesture).
 */
function activateSpotifyOnGesture() {
  spotifyPlayer.activate()
}

function activateUser() {
  if (userActivateDone) return
  userActivateDone = true
  userActivated.value = true
  document.removeEventListener('pointerdown', activateUser)
  document.removeEventListener('keydown', activateUser)
  audioPlayerRef.value?.unlockSilentAudio()
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } })
      .audioSession
    if (session) session.type = 'playback'
  } catch {
    // audioSession is a Safari-only hint; ignore if unsupported
  }
}

const fallbackTrack = {
  name: '',
  album: { images: [] as Array<{ url: string }> },
  artists: [] as Array<{ name: string }>
}

function updateMediaSession(song: SongData | null) {
  if (!song) {
    document.title = 'Quefy'
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
    }
    return
  }

  document.title = `${song.title} — ${song.artists?.join(', ') || song.addedBy} — Quefy`

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artists?.join(', ') || song.addedBy,
      album: song.albumName || '',
      // No `type`: covers are JPEG (Spotify) or WebP/JPEG (YouTube), and a
      // wrong type can make widgets skip the image.
      artwork: song.albumImageUrl ? [{ src: song.albumImageUrl }] : []
    })

    navigator.mediaSession.playbackState = roomState.value.isPlaying
      ? 'playing'
      : 'paused'

    navigator.mediaSession.setActionHandler('play', () => {
      if (!roomState.value.isPlaying) {
        handleMediaPlay()
      }
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      if (roomState.value.isPlaying) {
        handleMediaPause()
      }
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => skip())
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (song.source === 'spotify') {
        spotifyPlayer.seek(0)
      } else {
        audioPlayerRef.value?.seek(0)
      }
    })
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      const seconds = details.seekTime ?? 0
      if (song.source === 'spotify') {
        spotifyPlayer.seek(Math.round(seconds * 1000))
      } else {
        audioPlayerRef.value?.seek(seconds)
      }
    })
  }
}

function updateMediaSessionPlaybackState() {
  if (!('mediaSession' in navigator)) return
  if (!roomState.value.currentSong) {
    navigator.mediaSession.playbackState = 'none'
    return
  }
  navigator.mediaSession.playbackState = roomState.value.isPlaying
    ? 'playing'
    : 'paused'
}

function updateMediaSessionPosition(song: SongData | null) {
  if (!song || !('mediaSession' in navigator)) return

  const mediaSessionWithPosition = navigator.mediaSession as MediaSession & {
    setPositionState?: (state: MediaPositionState) => void
  }

  if (!mediaSessionWithPosition.setPositionState) return

  let durationSeconds = 0
  let positionSeconds = 0

  if (song.source === 'spotify') {
    durationSeconds = Math.max(0, spotifyPlayer.duration.value / 1000)
    positionSeconds = Math.max(0, spotifyPlayer.position.value / 1000)
  } else {
    durationSeconds = Math.max(
      0,
      audioPlayerRef.value?.state.duration.value ?? 0
    )
    positionSeconds = Math.max(
      0,
      audioPlayerRef.value?.state.currentTime.value ?? 0
    )
  }

  if (!isFinite(durationSeconds) || durationSeconds <= 0) return

  mediaSessionWithPosition.setPositionState({
    duration: durationSeconds,
    playbackRate: 1,
    position: Math.min(positionSeconds, durationSeconds)
  })
}

function syncPlayState() {
  if (!isHost.value || !hostData.value?.hostToken) return
  $fetch(`/api/room/${roomId}/play`, {
    method: 'POST',
    body: { hostToken: hostData.value.hostToken }
  }).catch(() => {})
}

function handleMediaPlay() {
  const song = roomState.value.currentSong
  if (!song) return

  roomState.value.isPlaying = true
  updateMediaSessionPlaybackState()

  if (song.source === 'spotify') {
    spotifyPlayer.play().catch(() => {})
  } else {
    audioPlayerRef.value?.resume()
  }

  syncPlayState()
}

function handleMediaPause() {
  const song = roomState.value.currentSong
  if (!song) return

  roomState.value.isPlaying = false
  updateMediaSessionPlaybackState()

  if (song.source === 'spotify') {
    spotifyPlayer.pause().catch(() => {})
  } else {
    audioPlayerRef.value?.pause()
  }

  syncPlayState()
}

function onSpotifyPlayerReady() {
  if (!isHost.value) return
  $fetch(`/api/room/${roomId}/spotify-ready`, {
    method: 'POST',
    body: { hostToken: hostData.value?.hostToken }
  }).catch(() => {})
  spotifyPlayer.setOnTrackEnd(skip)
  if (
    roomState.value.currentSong?.source === 'spotify' &&
    roomState.value.currentSong.trackUri &&
    roomState.value.isPlaying
  ) {
    audioPlayerRef.value?.pause()
    transferSpotifyPlayback(roomState.value.currentSong.trackUri)
  }
}

let skipping = false
const refreshingAudio = ref(false)
let lastSongId: string | null = null
let currentPlayingId = ''
const retryCount = new Map<string, number>()

/**
 * Fetch the next track's stream once the current one has played this long
 * (so rapid skipping doesn't fire requests), or near its end at the latest.
 */
const PREFETCH_AFTER_S = 5
const PREFETCH_LEAD_S = 30
/**
 * Stream URLs resolved in this browser (prefetched or refreshed), by song id.
 * Live room updates replace song objects and drop client-side `url`s, so
 * this map is the source of truth for them.
 */
const prefetchedUrls = new Map<string, string>()
/** Songs already tried (success or failure): at most one attempt each. */
const prefetchAttempted = new Set<string>()
/** Prefetches still running, so a skip can wait for one instead of racing it. */
const prefetchInFlight = new Map<string, Promise<string | undefined>>()
/** Shown on the "Up next" row: preparing the stream, or ready to play. */
const prefetchStatus = ref<Record<string, 'loading' | 'ready'>>({})
/**
 * The audio song this device is starting (resolving its URL, waiting for
 * YouTube's activation delay, buffering). Cleared once audio plays.
 */
const loadingSongId = ref<string | null>(null)
/** Status badge for the next song only (host only; others don't prefetch). */
const upNextStatus = computed<Record<string, 'loading' | 'ready'>>(() => {
  const next = roomState.value.queue[0]
  if (!isHost.value || !isAudioSong(next)) return {}
  const status = prefetchStatus.value[next.id] ?? (next.url ? 'ready' : undefined)
  return status ? { [next.id]: status } : {}
})
const audioLoading = computed(
  () =>
    !!loadingSongId.value &&
    loadingSongId.value === roomState.value.currentSong?.id
)

function isAudioSong(song: SongData | null | undefined): song is SongData {
  return song?.source === 'youtube' || song?.source === 'soundcloud'
}

/** Remember a stream URL resolved in this browser for `songId`. */
function resolvedUrlFor(songId: string, url: string) {
  prefetchedUrls.set(songId, url)
}

/** A playable URL for `song` if we already have one, without a request. */
function knownUrl(song: SongData): string | undefined {
  return song.url ?? prefetchedUrls.get(song.id)
}

/**
 * Resolve the next queued song's stream URL while the current one plays, so
 * the track change (automatic or skip) needs no network round trip and no
 * ~5s activation wait. Keeps playback going when the phone is locked.
 */
async function prefetchNext() {
  const next = roomState.value.queue[0]
  if (!isHost.value || !hostData.value?.hostToken) return
  if (!isAudioSong(next) || knownUrl(next) || prefetchAttempted.has(next.id)) {
    return
  }
  const body: Record<string, string> = { hostToken: hostData.value.hostToken }
  if (next.videoId) body.videoId = next.videoId
  else if (next.trackUrl) body.trackUrl = next.trackUrl
  else return

  prefetchAttempted.add(next.id)
  prefetchStatus.value = { ...prefetchStatus.value, [next.id]: 'loading' }
  const request = $fetch<{ url: string }>(`/api/room/${roomId}/audio/refresh`, {
    method: 'POST',
    body
  })
    .then((res) => {
      prefetchedUrls.set(next.id, res.url)
      prefetchStatus.value = { ...prefetchStatus.value, [next.id]: 'ready' }
      return res.url
    })
    // Not fatal: the song is resolved normally when it starts.
    .catch(() => {
      const { [next.id]: _, ...rest } = prefetchStatus.value
      prefetchStatus.value = rest
      return undefined
    })
    .finally(() => prefetchInFlight.delete(next.id))
  prefetchInFlight.set(next.id, request)
  await request
}

watch(
  () => audioPlayerRef.value?.state.currentTime.value ?? 0,
  (t) => {
    const d = audioPlayerRef.value?.state.duration.value ?? 0
    if (d > 0 && (t >= PREFETCH_AFTER_S || d - t <= PREFETCH_LEAD_S)) {
      void prefetchNext()
    }
  }
)

// Same while a Spotify song plays, so a YouTube/SoundCloud song after it
// is ready too.
watch(
  () => spotifyPlayer.position.value,
  (ms) => {
    if (roomState.value.currentSong?.source !== 'spotify') return
    const d = spotifyPlayer.duration.value
    if (d > 0 && (ms >= PREFETCH_AFTER_S * 1000 || d - ms <= PREFETCH_LEAD_S * 1000)) {
      void prefetchNext()
    }
  }
)

// Forget prefetched URLs for songs that left the queue.
watch(
  () => roomState.value.queue.map((s) => s.id),
  (ids) => {
    const keep = new Set([...ids, roomState.value.currentSong?.id])
    for (const id of prefetchedUrls.keys()) {
      if (!keep.has(id)) prefetchedUrls.delete(id)
    }
    for (const id of prefetchAttempted) {
      if (!keep.has(id)) prefetchAttempted.delete(id)
    }
    prefetchStatus.value = Object.fromEntries(
      Object.entries(prefetchStatus.value).filter(([id]) => ids.includes(id))
    )
  }
)

// The loading state ends when audio actually plays, the room stops (pause,
// blocked autoplay), or an error is shown.
watch(
  () => audioPlayerRef.value?.state.playing.value,
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

/** Mark `song` as starting on this device, if it is an audio song. */
function markLoading(song: SongData | null | undefined) {
  loadingSongId.value =
    isAudioSong(song) && roomState.value.isPlaying ? song.id : null
}
const RETRY_LIMIT = 2
const retryExhausted = ref(false)

function audioRefreshBody(song: SongData): Record<string, string> | null {
  const hostToken = hostData.value?.hostToken
  if (!hostToken) return null
  if (song.videoId) return { hostToken, videoId: song.videoId }
  if (song.trackUrl) return { hostToken, trackUrl: song.trackUrl }
  return null
}

/** Where to resume after a refresh: the live audio position, else the room's. */
function resumeTimeSeconds(): number | undefined {
  const live = audioPlayerRef.value?.state.currentTime.value ?? 0
  if (live > 0) return live
  return roomState.value.position > 0
    ? roomState.value.position / 1000
    : undefined
}

type RefreshResult = 'played' | 'stale' | 'exhausted' | 'failed' | 'busy'

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
  const body = audioRefreshBody(song)
  if (!body) return 'failed'

  const attempts = retryCount.get(song.id) ?? 0
  if (!manual && attempts >= RETRY_LIMIT) {
    retryExhausted.value = true
    error.value = `Failed to load audio after ${RETRY_LIMIT} attempts.`
    return 'exhausted'
  }

  refreshingAudio.value = true
  if (!manual) retryCount.set(song.id, attempts + 1)
  try {
    const refreshed = await $fetch<{
      url: string
      title: string
      durationMs: number
    }>(`/api/room/${roomId}/audio/refresh`, { method: 'POST', body })
    if (roomState.value.currentSong?.id !== song.id) return 'stale'

    retryCount.delete(song.id)
    retryExhausted.value = false
    error.value = ''
    song.url = refreshed.url
    resolvedUrlFor(song.id, refreshed.url)
    if (!song.title || song.title === 'Unknown Title') song.title = refreshed.title
    if (!song.durationMs) song.durationMs = refreshed.durationMs

    if (play) {
      const startTime = resumeTimeSeconds()
      nextTick(() => {
        // Paused while the URL was resolving: don't start it.
        if (roomState.value.currentSong?.id !== song.id) return
        if (!roomState.value.isPlaying) return
        audioPlayerRef.value?.play(refreshed.url, startTime)
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

async function handleSongChange(song: SongData) {
  if (!isHost.value) return
  if (song.id === currentPlayingId) return
  currentPlayingId = song.id
  markLoading(song)
  if (isAudioSong(song) && !song.url) {
    const pending = prefetchInFlight.get(song.id)
    const prefetched = prefetchedUrls.get(song.id) ?? (await pending)
    if (song.id !== currentPlayingId) return
    if (prefetched) song.url = prefetched
  }
  try {
    if (song.source === 'spotify' && song.trackUri) {
      audioPlayerRef.value?.pause()
      spotifyPlayer.setOnTrackEnd(skip)
      await transferSpotifyPlayback(song.trackUri)
      if (song.id !== currentPlayingId) return
    }
    if ((song.source === 'youtube' || song.source === 'soundcloud') && song.url) {
      spotifyPlayer.setOnTrackEnd(null)
      spotifyPlayer.resetErrors()
      await spotifyPlayer.pause()
      if (song.id !== currentPlayingId) return
      if (roomState.value.isPlaying) {
        const url = song.url!
        const startTime =
          roomState.value.position > 0
            ? roomState.value.position / 1000
            : undefined
        nextTick(() => {
          if (song.id !== currentPlayingId || !roomState.value.isPlaying) return
          audioPlayerRef.value?.play(url, startTime)
        })
      }
    }
    if (
      (song.source === 'youtube' || song.source === 'soundcloud') &&
      !song.url
    ) {
      if (!audioRefreshBody(song)) {
        skip()
        return
      }
      spotifyPlayer.setOnTrackEnd(null)
      spotifyPlayer.resetErrors()
      await spotifyPlayer.pause()
      if (song.id !== currentPlayingId) return
      if (roomState.value.isPlaying) {
        const result = await refreshAndPlay(song)
        if (result === 'failed') skip()
      }
    }
  } catch (err: unknown) {
    error.value = `Song change failed: ${err instanceof Error ? err.message : err}`
    skip()
  }
}

let positionTimer: ReturnType<typeof setInterval> | null = null
let lastKnownPosition = 0

async function reportPosition() {
  if (!isHost.value || !hostData.value?.hostToken) return

  const song = roomState.value.currentSong
  if (!song) return

  const locallyPlaying =
    song.source === 'spotify'
      ? !spotifyPlayer.paused.value
      : (audioPlayerRef.value?.state.playing.value ?? false)

  if (!locallyPlaying) return

  let position = 0
  if (song.source === 'spotify') {
    position = spotifyPlayer.position.value
  } else {
    position = Math.round(
      (audioPlayerRef.value?.state.currentTime.value ?? 0) * 1000
    )
  }

  lastKnownPosition = position

  if (position > 0) {
    $fetch(`/api/room/${roomId}/position`, {
      method: 'POST',
      body: { hostToken: hostData.value.hostToken, position }
    }).catch(() => {})
  }
}

watch(
  () => roomState.value.currentSong,
  (song) => {
    if (!song || !isHost.value) return
    if (song.id === lastSongId) return
    lastSongId = song.id
    void handleSongChange(song)
  }
)

watch(
  () => spotifyPlayer.error.value,
  (val) => {
    if (val && isHost.value) error.value = val
  }
)

watch(
  () => roomState.value.currentSong,
  (song) => {
    updateMediaSession(song)
    updateMediaSessionPosition(song)
  },
  { immediate: true }
)

watch(
  () => roomState.value.isPlaying,
  () => {
    updateMediaSessionPlaybackState()
  }
)

function spotifyAnchorTiming() {
  return {
    durationMs: spotifyPlayer.duration.value,
    positionMs: spotifyPlayer.position.value
  }
}

// Spotify plays inside the SDK's iframe, which OS media widgets then show as
// "Spotify Embedded Player". A silent loop in this page keeps our metadata
// (title, artist, artwork) the one that is shown.
watch(
  () =>
    isHost.value &&
    roomState.value.currentSong?.source === 'spotify' &&
    !spotifyPlayer.paused.value,
  (active) => {
    setMediaSessionAnchor(active, spotifyAnchorTiming())
    if (active) updateMediaSession(roomState.value.currentSong)
  },
  { immediate: true }
)
// Widgets show the anchor's length/progress: keep it matching Spotify's.
watch(
  () => [spotifyPlayer.duration.value, spotifyPlayer.position.value] as const,
  ([durationMs, positionMs]) => {
    if (roomState.value.currentSong?.source !== 'spotify') return
    syncMediaSessionAnchor(durationMs, positionMs)
  }
)
// KDE's browser integration controls the anchor element itself (pause/play)
// rather than calling our Media Session handlers, and reads metadata when a
// player starts; route both back into the room.
// (Registered on mount so a previous room page's cleanup can't clear them.)
onMounted(() =>
  setMediaSessionAnchorHooks({
    // Widgets register a new player slightly after it starts; re-send the
    // metadata then (cleared first so it counts as a change).
    onPlaying: () =>
      setTimeout(() => {
        if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
        updateMediaSession(roomState.value.currentSong)
      }, 500),
    onExternalPause: () => {
      if (roomState.value.isPlaying) handleMediaPause()
    },
    onExternalPlay: () => {
      if (!roomState.value.isPlaying) handleMediaPlay()
    },
    onExternalSeek: (seconds) => {
      if (roomState.value.currentSong?.source !== 'spotify') return
      spotifyPlayer.seek(Math.round(seconds * 1000))
    }
  })
)
// Widgets follow the most recently started player. The Spotify frame
// (re)starts its audio a moment after it reports playing: on resume, on a
// new track, and when a stuck start is re-sent. Restart the anchor after
// each of those so it stays the newest.
let anchorReassertTimer: ReturnType<typeof setTimeout> | undefined
function reassertAnchorSoon() {
  clearTimeout(anchorReassertTimer)
  anchorReassertTimer = setTimeout(() => {
    const active =
      isHost.value &&
      roomState.value.currentSong?.source === 'spotify' &&
      !spotifyPlayer.paused.value
    if (active) {
      setMediaSessionAnchor(true, { ...spotifyAnchorTiming(), restart: true })
    }
  }, 1500)
}
watch(
  () => [spotifyPlayer.currentTrack.value?.uri, spotifyPlayer.paused.value] as const,
  ([uri, paused], [prevUri, prevPaused]) => {
    if (paused || !uri) return
    if (uri !== prevUri || prevPaused) reassertAnchorSoon()
  }
)

watch(
  () => [
    spotifyPlayer.position.value,
    spotifyPlayer.duration.value,
    audioPlayerRef.value?.state.currentTime.value,
    audioPlayerRef.value?.state.duration.value
  ],
  () => {
    updateMediaSessionPosition(roomState.value.currentSong)
  }
)

/**
 * The first track a freshly connected Spotify player plays reports "paused"
 * about a second in and really stops ~30s later. An SDK resume() without a
 * click doesn't help, but re-sending the play request does (verified in
 * Chrome). So shortly after starting a track, check, and if the room should
 * be playing it but Spotify says paused, ask again from where it is.
 */
function confirmSpotifyStarted(trackUri: string, retriesLeft = 2) {
  setTimeout(() => {
    const song = roomState.value.currentSong
    if (!roomState.value.isPlaying || song?.trackUri !== trackUri) return
    if (spotifyPlayer.currentTrack.value?.uri !== trackUri) return
    if (!spotifyPlayer.paused.value || retriesLeft <= 0) return
    void transferSpotifyPlayback(trackUri, {
      positionMs: spotifyPlayer.position.value,
      retriesLeft: retriesLeft - 1
    })
  }, 2500)
}

async function transferSpotifyPlayback(
  trackUri: string,
  {
    positionMs = roomState.value.position,
    retriesLeft = 2
  }: { positionMs?: number; retriesLeft?: number } = {}
) {
  if (!roomState.value.isPlaying) return

  spotifyPlayer.position.value = positionMs

  let token = spotifyAuth.getAccessToken()
  if (!token) {
    const refreshed = await spotifyAuth.refreshToken()
    if (!refreshed) {
      error.value = 'Spotify session expired. Reconnect Spotify.'
      return
    }
    token = spotifyAuth.getAccessToken()
    if (!token) {
      error.value = 'Spotify session expired. Reconnect Spotify.'
      return
    }
  }

  const deviceId = spotifyPlayer.deviceId.value
  if (!spotifyPlayer.deviceId.value) return

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  // `play?device_id=` already moves playback to this device. A separate
  // "transfer with play:false" first is not just redundant: Spotify applies
  // it asynchronously, and its late "paused" state can land after playback
  // started, so the SDK reports paused while audio is playing.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!roomState.value.isPlaying) return

    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }

    const playRes = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: positionMs
        })
      }
    )
    if (playRes.ok) {
      confirmSpotifyStarted(trackUri, retriesLeft)
      return
    }

    if (playRes.status === 403) {
      const body = await playRes.text().catch(() => '')
      error.value = `Spotify Premium required: ${body.slice(0, 200)}`
      return
    }

    if (playRes.status !== 404) {
      const body = await playRes.text().catch(() => '')
      error.value = `Spotify play failed: ${body.slice(0, 200)}`
      return
    }

    // 404: Spotify doesn't know this device yet (it only just registered).
    // Make it the active device, then retry the play request.
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ device_ids: [deviceId], play: false })
    }).catch(() => {})
  }

  error.value = 'Spotify device did not become ready. Try again.'
}

async function addSongByVideoId(data: { videoId: string; title?: string; durationMs?: number; albumImageUrl?: string }) {
  addingSong.value = true
  error.value = ''
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: 'POST',
      body: { videoId: data.videoId, title: data.title, durationMs: data.durationMs, albumImageUrl: data.albumImageUrl, addedBy: 'Guest' }
    })
    await fetchRoomState()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Failed to add song.')
  } finally {
    addingSong.value = false
  }
}

async function addSpotifyTrack(track: {
  trackUri: string
  title: string
  artists?: string[]
  albumName?: string
  albumImageUrl?: string
  durationMs?: number
}) {
  addingSong.value = true
  error.value = ''
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: 'POST',
      body: { source: 'spotify', addedBy: 'Guest', ...track }
    })
    await fetchRoomState()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Failed to add song.')
  } finally {
    addingSong.value = false
  }
}

async function addSongBySoundcloudUrl(trackUrl: string) {
  addingSong.value = true
  error.value = ''
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: 'POST',
      body: { source: 'soundcloud', trackUrl, addedBy: 'Guest' }
    })
    await fetchRoomState()
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Failed to add SoundCloud track.')
  } finally {
    addingSong.value = false
  }
}

async function removeSong(songId: string) {
  if (!isHost.value || !hostData.value?.hostToken) return
  try {
    await $fetch(`/api/room/${roomId}/remove`, {
      method: 'POST',
      body: { songId, hostToken: hostData.value.hostToken }
    })
    await fetchRoomState()
  } catch {
    error.value = 'Failed to remove song.'
  }
}

function reorderQueue(songIds: string[]) {
  if (!isHost.value || !hostData.value?.hostToken) return
  $fetch(`/api/room/${roomId}/reorder`, {
    method: 'POST',
    body: { hostToken: hostData.value.hostToken, songIds }
  }).catch(() => {
    error.value = 'Failed to reorder queue.'
  })
}

/** Whether this device is actually producing the current song right now. */
function isPlayingLocally(song: SongData): boolean {
  if (song.source === 'spotify') {
    return (
      !spotifyPlayer.paused.value &&
      spotifyPlayer.currentTrack.value?.uri === song.trackUri
    )
  }
  return audioPlayerRef.value?.state.playing.value ?? false
}

/** Start the current song on this device without changing room state. */
function resumeLocally(song: SongData) {
  error.value = ''
  if (song.source === 'spotify' && song.trackUri) {
    audioPlayerRef.value?.pause()
    if (spotifyPlayer.currentTrack.value?.uri === song.trackUri) {
      void spotifyPlayer.play()
    } else {
      void transferSpotifyPlayback(song.trackUri)
    }
    return
  }
  const dur = audioPlayerRef.value?.state.duration.value ?? 0
  const url = knownUrl(song)
  if (dur > 0) {
    audioPlayerRef.value?.resume()
  } else if (url) {
    markLoading(song)
    audioPlayerRef.value?.play(
      url,
      roomState.value.position > 0 ? roomState.value.position / 1000 : undefined
    )
  } else {
    currentPlayingId = ''
    void handleSongChange(song)
  }
}

async function togglePlay() {
  if (!isHost.value || !hostData.value?.hostToken) return
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
  const prevSongId = roomState.value.currentSong?.id
  try {
    const res = await $fetch<{
      isPlaying: boolean
      currentSong: SongData | null
    }>(`/api/room/${roomId}/play`, {
      method: 'POST',
      body: { hostToken: hostData.value.hostToken }
    })

    roomState.value.isPlaying = res.isPlaying
    if (res.currentSong) {
      roomState.value.currentSong = res.currentSong
    }

    if (res.isPlaying) {
      const song = res.currentSong
      if (!song) return
      if (song.id === prevSongId) {
        if (song.source === 'spotify' && song.trackUri) {
          audioPlayerRef.value?.pause()
          const sdkTrackUri = spotifyPlayer.currentTrack.value?.uri
          if (sdkTrackUri === song.trackUri) {
            spotifyPlayer.play()
          } else {
            transferSpotifyPlayback(song.trackUri)
          }
        } else if (song.source === 'youtube' || song.source === 'soundcloud') {
          spotifyPlayer.pause()
          const dur = audioPlayerRef.value?.state.duration.value ?? 0
          if (dur > 0) {
            audioPlayerRef.value!.resume()
          } else if (knownUrl(song)) {
            const startTime =
              roomState.value.position > 0
                ? roomState.value.position / 1000
                : undefined
            markLoading(song)
            audioPlayerRef.value?.play(knownUrl(song)!, startTime)
          } else {
            // No URL yet (e.g. live state replaced the song object): resolve it.
            currentPlayingId = ''
            void handleSongChange(song)
          }
        }
      }
    } else {
      spotifyPlayer.pause()
      audioPlayerRef.value?.pause()
    }
  } catch (err: unknown) {
    error.value = `Playback failed: ${errorMessage(err)}`
  }
}

async function skip(
  { localAlreadyPlaying = false }: { localAlreadyPlaying?: boolean } = {}
) {
  if (!isHost.value || !hostData.value?.hostToken) return
  if (skipping) return
  skipping = true

  // Keep the iOS audio session alive through the track change.
  if (!localAlreadyPlaying) audioPlayerRef.value?.pause({ keepAlive: true })

  try {
    const res = await $fetch<{
      currentSong: SongData | null
      isPlaying: boolean
    }>(`/api/room/${roomId}/skip`, {
      method: 'POST',
      body: { hostToken: hostData.value.hostToken }
    })
    roomState.value.position = 0
    roomState.value.isPlaying = res.isPlaying

    if (localAlreadyPlaying && res.currentSong?.id === currentPlayingId) {
      // We already started this song locally; just adopt the server copy.
      lastSongId = res.currentSong.id
      res.currentSong.url ??= roomState.value.currentSong?.url
      roomState.value.currentSong = res.currentSong
      return
    }

    if (res.currentSong) {
      lastSongId = res.currentSong.id
    }
    roomState.value.currentSong = res.currentSong
    if (res.currentSong) {
      void handleSongChange(res.currentSong)
    } else {
      // Queue finished: now it's fine to release the audio session.
      audioPlayerRef.value?.pause()
      spotifyPlayer.pause()
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
  const url = isAudioSong(next) ? knownUrl(next) : undefined
  if (!next || !url || !roomState.value.isPlaying || skipping) {
    skip()
    return
  }

  next.url = url
  currentPlayingId = next.id
  lastSongId = next.id
  roomState.value.position = 0
  roomState.value.queue = roomState.value.queue.slice(1)
  roomState.value.currentSong = next
  spotifyPlayer.setOnTrackEnd(null)
  markLoading(next)
  nextTick(() => audioPlayerRef.value?.play(url))
  void skip({ localAlreadyPlaying: true })
}

function onPlayBlocked() {
  if (!isHost.value || !hostData.value?.hostToken) return
  $fetch(`/api/room/${roomId}/play`, {
    method: 'POST',
    body: { hostToken: hostData.value.hostToken }
  }).then((res) => {
    roomState.value.isPlaying = res.isPlaying
  }).catch(() => {})
}

async function onAudioError(msg: string) {
  if (refreshingAudio.value) return
  error.value = msg
  const song = roomState.value.currentSong
  if (!song) return skip()
  const result = await refreshAndPlay(song, { play: userActivated.value })
  if (result === 'failed') skip()
}

async function onAudioExpired() {
  if (refreshingAudio.value) return
  const song = roomState.value.currentSong
  if (!song) return skip()
  const result = await refreshAndPlay(song, { play: userActivated.value })
  if (result === 'failed') skip()
}

async function manualRefreshAudio() {
  const song = roomState.value.currentSong
  if (!song) return
  retryExhausted.value = false
  await refreshAndPlay(song, { manual: true })
}

async function exportQueue() {
  try {
    const data = await $fetch(`/api/room/${roomId}/export`)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `room-${roomId}-queue.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = 'Failed to export queue.'
  }
}

async function deleteRoom() {
  if (!isHost.value || !hostData.value?.hostToken) return
  try {
    await $fetch(`/api/room/${roomId}`, {
      method: 'DELETE',
      body: { hostToken: hostData.value.hostToken }
    })
    router.push('/app/room')
  } catch {
    error.value = 'Failed to delete room.'
  }
}

onMounted(() => {
  if (isHost.value) {
    positionTimer = setInterval(reportPosition, 2000)
  }

  document.addEventListener('pointerdown', activateSpotifyOnGesture, true)
  document.addEventListener('keydown', activateSpotifyOnGesture, true)
  document.addEventListener('pointerdown', activateUser, { once: true })
  document.addEventListener('keydown', activateUser, { once: true })
})

onUnmounted(() => {
  if (isHost.value && hostData.value?.hostToken && lastKnownPosition > 0) {
    const blob = new Blob(
      [
        JSON.stringify({
          hostToken: hostData.value.hostToken,
          position: lastKnownPosition
        })
      ],
      { type: 'application/json' }
    )
    navigator.sendBeacon(`/api/room/${roomId}/position`, blob)
  }

  if (positionTimer) clearInterval(positionTimer)
  document.removeEventListener('pointerdown', activateSpotifyOnGesture, true)
  document.removeEventListener('keydown', activateSpotifyOnGesture, true)
  clearTimeout(anchorReassertTimer)
  destroyMediaSessionAnchor()
  spotifyPlayer.destroy()
})
</script>
