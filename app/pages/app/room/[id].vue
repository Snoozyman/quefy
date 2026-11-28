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
import { errorMessage } from '#shared/utils/error'
import type {
  AudioPlayerHandle,
  PlaybackApi,
  PlayStateResponse
} from '~/playback/types'
import { createSpotifyStarter } from '~/playback/spotifyStart'
import { useRoomPlayback } from '~/playback/useRoomPlayback'
import { useMediaSession } from '~/playback/mediaSession'

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

const currentSongIsAudio = computed(
  () =>
    roomState.value.currentSong?.source === 'youtube' ||
    roomState.value.currentSong?.source === 'soundcloud'
)
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

const fallbackTrack = {
  name: '',
  album: { images: [] as Array<{ url: string }> },
  artists: [] as Array<{ name: string }>
}

const audioPlayerRef = ref<AudioPlayerHandle>()

// --- Playback -------------------------------------------------------------

const hostToken = () => hostData.value?.hostToken

/** Host-only room calls; each adds the host token. */
const api: PlaybackApi = {
  togglePlay: () =>
    $fetch<PlayStateResponse>(`/api/room/${roomId}/play`, {
      method: 'POST',
      body: { hostToken: hostToken() }
    }),
  skip: () =>
    $fetch<PlayStateResponse>(`/api/room/${roomId}/skip`, {
      method: 'POST',
      body: { hostToken: hostToken() }
    }),
  refreshAudio: (source) =>
    $fetch<{ url: string; title: string; durationMs: number }>(
      `/api/room/${roomId}/audio/refresh`,
      {
        method: 'POST',
        body: { hostToken: hostToken(), ...source }
      }
    ),
  reportPosition: (position) =>
    $fetch<unknown>(`/api/room/${roomId}/position`, {
      method: 'POST',
      body: { hostToken: hostToken(), position }
    })
}

const spotifyStarter = createSpotifyStarter({
  player: spotifyPlayer,
  getAccessToken: () => spotifyAuth.getAccessToken(),
  refreshToken: () => spotifyAuth.refreshToken(),
  isRoomPlaying: () => roomState.value.isPlaying,
  currentTrackUri: () => roomState.value.currentSong?.trackUri,
  roomPosition: () => roomState.value.position,
  onError: (message) => {
    error.value = message
  }
})

const userActivated = ref(false)

const {
  audioLoading,
  upNextStatus,
  refreshingAudio,
  retryExhausted,
  togglePlay,
  skip,
  onAudioEnded,
  onAudioError,
  onAudioExpired,
  onPlayBlocked,
  manualRefreshAudio,
  mediaPlay,
  mediaPause,
  onSpotifyReady,
  reportPosition,
  lastKnownPosition
} = useRoomPlayback({
  roomState,
  isHost,
  hasHostToken: () => !!hostToken(),
  error,
  audio: () => audioPlayerRef.value,
  spotify: spotifyPlayer,
  startSpotify: spotifyStarter.start,
  api,
  userActivated
})

const mediaSession = useMediaSession({
  roomState,
  isHost,
  audio: () => audioPlayerRef.value,
  spotify: spotifyPlayer,
  onPlay: mediaPlay,
  onPause: mediaPause,
  onNext: () => void skip()
})

watch(
  () => spotifyPlayer.error.value,
  (val) => {
    if (val && isHost.value) error.value = val
  }
)

function onSpotifyPlayerReady() {
  if (!isHost.value) return
  $fetch(`/api/room/${roomId}/spotify-ready`, {
    method: 'POST',
    body: { hostToken: hostToken() }
  }).catch(() => {})
  onSpotifyReady()
}

// --- User activation (autoplay) ---------------------------------------------

/**
 * Browsers only let the Spotify SDK start audio after it was "activated"
 * inside a user gesture. The player may not exist at the first click, so do
 * this on every click/key (capture phase = still inside the gesture).
 */
function activateSpotifyOnGesture() {
  spotifyPlayer.activate()
}

function activateUser() {
  if (userActivated.value) return
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

// --- Queue actions ----------------------------------------------------------

async function addToQueue(body: Record<string, unknown>, failure: string) {
  addingSong.value = true
  error.value = ''
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: 'POST',
      body: { addedBy: 'Guest', ...body }
    })
    await fetchRoomState()
  } catch (err: unknown) {
    error.value = errorMessage(err, failure)
  } finally {
    addingSong.value = false
  }
}

function addSongByVideoId(data: {
  videoId: string
  title?: string
  durationMs?: number
  albumImageUrl?: string
}) {
  return addToQueue({ ...data }, 'Failed to add song.')
}

function addSpotifyTrack(track: {
  trackUri: string
  title: string
  artists?: string[]
  albumName?: string
  albumImageUrl?: string
  durationMs?: number
}) {
  return addToQueue({ source: 'spotify', ...track }, 'Failed to add song.')
}

function addSongBySoundcloudUrl(trackUrl: string) {
  return addToQueue(
    { source: 'soundcloud', trackUrl },
    'Failed to add SoundCloud track.'
  )
}

async function removeSong(songId: string) {
  if (!isHost.value || !hostToken()) return
  try {
    await $fetch(`/api/room/${roomId}/remove`, {
      method: 'POST',
      body: { songId, hostToken: hostToken() }
    })
    await fetchRoomState()
  } catch (err: unknown) {
    error.value = `Failed to remove song: ${errorMessage(err)}`
  }
}

function reorderQueue(songIds: string[]) {
  if (!isHost.value || !hostToken()) return
  $fetch(`/api/room/${roomId}/reorder`, {
    method: 'POST',
    body: { hostToken: hostToken(), songIds }
  }).catch((err: unknown) => {
    error.value = `Failed to reorder queue: ${errorMessage(err)}`
  })
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
  } catch (err: unknown) {
    error.value = `Failed to export queue: ${errorMessage(err)}`
  }
}

async function deleteRoom() {
  if (!isHost.value || !hostToken()) return
  try {
    await $fetch(`/api/room/${roomId}`, {
      method: 'DELETE',
      body: { hostToken: hostToken() }
    })
    router.push('/app/room')
  } catch (err: unknown) {
    error.value = `Failed to delete room: ${errorMessage(err)}`
  }
}

// --- Lifecycle --------------------------------------------------------------

let positionTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (isHost.value) positionTimer = setInterval(reportPosition, 2000)
  mediaSession.registerAnchorHooks()
  document.addEventListener('pointerdown', activateSpotifyOnGesture, true)
  document.addEventListener('keydown', activateSpotifyOnGesture, true)
  document.addEventListener('pointerdown', activateUser, { once: true })
  document.addEventListener('keydown', activateUser, { once: true })
})

onUnmounted(() => {
  const position = lastKnownPosition()
  if (isHost.value && hostToken() && position > 0) {
    const blob = new Blob(
      [JSON.stringify({ hostToken: hostToken(), position })],
      { type: 'application/json' }
    )
    navigator.sendBeacon(`/api/room/${roomId}/position`, blob)
  }

  if (positionTimer) clearInterval(positionTimer)
  document.removeEventListener('pointerdown', activateSpotifyOnGesture, true)
  document.removeEventListener('keydown', activateSpotifyOnGesture, true)
  mediaSession.dispose()
  spotifyPlayer.destroy()
})
</script>
