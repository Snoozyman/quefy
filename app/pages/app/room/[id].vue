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
    <UIcon
      name="i-lucide-door-open"
      class="size-12 text-muted"
    />
    <h2 class="text-lg font-semibold">
      Room not found
    </h2>
    <p class="text-sm text-muted">
      This room may have expired or the code is incorrect.
    </p>
    <UButton
      to="/app/room"
      variant="outline"
    >
      Back to Rooms
    </UButton>
  </div>
  <div
    v-else
    class="mx-2 w-50vw md:mx-4 md:w-2xl space-y-6 py-6"
  >
    <UCard>
      <template #header>
        <div class="flex flex-col justify-between">
          <div class="flex-1 space-y-1 mb-2">
            <h1 class="text-2xl font-bold">
              {{ roomState.title || "Room" }}
            </h1>
            <p class="text-sm text-muted">
              <NuxtLink
                to="/app/room"
                class="hover:underline"
              >Rooms</NuxtLink>
              · Code:
              <code
                class="font-mono font-bold text-primary cursor-pointer select-all"
                @click="copyRoomCode"
              >{{ roomId }}</code>
              <span
                v-if="copied"
                class="ml-2 text-xs text-muted"
              >Copied!</span>
            </p>
          </div>
          <div class="flex flex-row items-center gap-2 flex-wrap">
            <UButton
              v-if="isHost"
              size="sm"
              variant="outline"
              :icon="roomState.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
              :disabled="playDisabled"
              @click="togglePlay"
            >
              {{ roomState.isPlaying ? "Pause" : "Play" }}
            </UButton>
            <UButton
              v-if="isHost"
              size="sm"
              variant="outline"
              icon="i-lucide-skip-forward"
              :disabled="!roomState.currentSong"
              @click="skip"
            >
              Skip
            </UButton>
          </div>
        </div>
      </template>
      <template #default>
        <div class="flex flex-col gap-2 mb-4">
          <p class="text-sm text-muted">
            {{ roomState.queue.length }} song(s) in queue
          </p>
          <p
            v-if="!isHost"
            class="text-sm text-muted"
          >
            You are a guest. Only the host can control playback.
          </p>
        </div>

        <div class="flex gap-px bg-border rounded-lg mb-4">
          <button
            class="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="activeTab === 'player'
              ? 'bg-primary text-primary-foreground'
              : 'bg-default text-muted hover:bg-muted/50'"
            @click="activeTab = 'player'"
          >
            Player
          </button>
          <button
            class="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="activeTab === 'settings'
              ? 'bg-primary text-primary-foreground'
              : 'bg-default text-muted hover:bg-muted/50'"
            @click="activeTab = 'settings'"
          >
            Settings
          </button>
        </div>

        <div v-show="activeTab === 'player'">
          <RoomSpotifyPlayer
            :show="
              isHost
                && !!roomState.currentSong
                && roomState.currentSong.source === 'spotify'
                && spotifyPlayer.isReady.value
                && !!spotifyPlayer.currentTrack.value
            "
            :track="spotifyPlayer.currentTrack.value ?? fallbackTrack"
            :paused="spotifyPlayer.paused.value"
            :position="spotifyPlayer.position.value"
            :duration="spotifyPlayer.duration.value"
            @play="spotifyPlayer.play()"
            @pause="spotifyPlayer.pause()"
            @seek="(v: number) => spotifyPlayer.seek(v)"
          />

          <RoomAudioPlayer
            ref="audioPlayerRef"
            :show="isHost && currentSongIsAudio"
            :current-song="roomState.currentSong"
            :is-playing="roomState.isPlaying"
            @ended="onAudioEnded"
            @error="(msg: string) => onAudioError(msg)"
            @expired="onAudioExpired"
          />

          <RoomNowPlaying
            v-if="!isHost"
            :song="roomState.currentSong"
          />
        </div>

        <div v-show="activeTab === 'settings'">
          <div class="flex flex-col gap-3">
            <div
              v-if="isHost"
              class="flex items-center justify-between"
            >
              <span class="text-sm">Cookies</span>
              <RoomCookieUpload />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Export queue</span>
              <UButton
                size="sm"
                variant="outline"
                icon="i-lucide-download"
                @click="exportQueue"
              >
                Export
              </UButton>
            </div>
            <div
              v-if="isHost"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-red-500">Delete room</span>
              <UButton
                size="sm"
                color="warning"
                icon="i-lucide-trash"
                @click="deleteRoom"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <RoomSpotifyConnectBanner
      :room-id="roomId"
      @player-ready="onSpotifyPlayerReady"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :description="error"
      closable
      @close="error = ''"
    />

    <RoomSongSearch
      :room-id="roomId"
      :adding-song="addingSong"
      :spotify-connected="roomState.spotifyConnected"
      @add-youtube="addSongByVideoId"
      @add-spotify="addSpotifyTrack"
      @add-soundcloud="addSongBySoundcloudUrl"
    />

    <RoomSongQueue
      :queue="roomState.queue"
      :is-host="isHost"
      @remove="removeSong"
    />
  </div>
</template>

<script lang="ts" setup>
import type { SongData, RoomState, SearchResult } from '#shared/types/room'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const loading = ref(true)
const addingSong = ref(false)
const error = ref('')
const copied = ref(false)
const notFound = ref(false)
const activeTab = ref<'player' | 'settings'>('player')

const roomState = ref<RoomState>({
  id: roomId,
  title: '',
  currentSong: null,
  queue: [],
  isPlaying: false,
  spotifyConnected: false,
  createdAt: 0,
  position: 0
})

const hostData = ref<{ roomId: string, hostToken: string } | null>(null)
const isHost = computed(
  () => hostData.value?.roomId === roomId && !!hostData.value?.hostToken
)
const playDisabled = computed(
  () => !roomState.value.queue.length && !roomState.value.currentSong
)
const currentSongIsAudio = computed(
  () =>
    roomState.value.currentSong?.source === 'youtube'
    || roomState.value.currentSong?.source === 'soundcloud'
)

const spotifyAuth = useSpotifyAuth()
const spotifyPlayer = useSpotifyPlayer()

const audioPlayerRef = ref<{
  play: (url: string, startTime?: number) => void
  pause: () => void
  state: { playing: boolean, currentTime: number, duration: number, volume: number, seekValue: number }
}>()

const userActivated = ref(false)
let userActivateDone = false

function activateUser() {
  if (userActivateDone) return
  userActivateDone = true
  userActivated.value = true
  document.removeEventListener('pointerdown', activateUser)
  document.removeEventListener('keydown', activateUser)
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
    }
    return
  }

  document.title = `${song.title} — ${song.artists?.join(', ') || song.addedBy} — Quefy`

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artists?.join(', ') || song.addedBy,
      album: song.albumName || '',
      artwork: song.albumImageUrl
        ? [{ src: song.albumImageUrl, sizes: '512x512', type: 'image/png' }]
        : []
    })

    navigator.mediaSession.setActionHandler('play', () => spotifyPlayer.play())
    navigator.mediaSession.setActionHandler('pause', () =>
      spotifyPlayer.pause()
    )
    navigator.mediaSession.setActionHandler('nexttrack', () => skip())
  }
}

function copyRoomCode() {
  navigator.clipboard.writeText(roomId)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
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

function onSpotifyPlayerReady() {
  if (!isHost.value) return
  $fetch(`/api/room/${roomId}/spotify-ready`, {
    method: 'POST',
    body: { hostToken: hostData.value?.hostToken }
  }).catch(() => {})
  spotifyPlayer.setOnTrackEnd(skip)
  if (
    roomState.value.currentSong?.source === 'spotify'
    && roomState.value.currentSong.trackUri
    && roomState.value.isPlaying
  ) {
    audioPlayerRef.value?.pause()
    transferSpotifyPlayback(roomState.value.currentSong.trackUri)
  }
}

async function fetchRoomState() {
  try {
    roomState.value = await $fetch<RoomState>(`/api/room/${roomId}`)
  } catch {}
}

let lastSongId: string | null = null
let currentPlayingId = ''

function handleSongChange(song: SongData) {
  if (!isHost.value) return
  if (song.id === currentPlayingId) return
  currentPlayingId = song.id
  if (song.source === 'spotify' && song.trackUri) {
    audioPlayerRef.value?.pause()
    spotifyPlayer.setOnTrackEnd(skip)
    transferSpotifyPlayback(song.trackUri)
  }
  if ((song.source === 'youtube' || song.source === 'soundcloud') && song.url) {
    spotifyPlayer.setOnTrackEnd(null)
    spotifyPlayer.resetErrors()
    spotifyPlayer.pause()
    if (roomState.value.isPlaying) {
      if (!userActivated.value) return
      const url = song.url!
      const startTime = roomState.value.position > 0
        ? roomState.value.position / 1000
        : undefined
      nextTick(() => {
        audioPlayerRef.value?.play(url, startTime)
      })
    }
  }
}

let eventSource: EventSource | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let positionTimer: ReturnType<typeof setInterval> | null = null
let pageLeaving = false

function connectSSE() {
  const sseUrl = hostData.value?.hostToken
    ? `/api/room/${roomId}/events?hostToken=${hostData.value.hostToken}`
    : `/api/room/${roomId}/events`
  eventSource = new EventSource(sseUrl)

  eventSource.addEventListener('room-update', (event) => {
    const newState = JSON.parse(event.data) as RoomState
    const songChanged
      = newState.currentSong?.id !== roomState.value.currentSong?.id
    roomState.value = newState

    if (songChanged && newState.currentSong) {
      lastSongId = newState.currentSong.id
      handleSongChange(newState.currentSong)
    } else if (!newState.currentSong) {
      lastSongId = null
    }
  })

  eventSource.onerror = () => {
    if (pageLeaving) return
    console.warn('SSE connection failed, falling back to polling')
    eventSource?.close()
    eventSource = null
    startPolling()
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(fetchRoomState, 3000)
}

async function reportPosition() {
  if (!isHost.value || !hostData.value?.hostToken) return
  if (!roomState.value.isPlaying) return

  const song = roomState.value.currentSong
  if (!song) return

  let position = 0
  if (song.source === 'spotify') {
    position = spotifyPlayer.position.value
  } else {
    position = Math.round((audioPlayerRef.value?.state.currentTime ?? 0) * 1000)
  }

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
    handleSongChange(song)
  }
)

watch(
  () => spotifyPlayer.error.value,
  (val) => {
    if (val) error.value = val
  }
)

watch(
  () => roomState.value.currentSong,
  (song) => {
    updateMediaSession(song)
  },
  { immediate: true }
)

async function transferSpotifyPlayback(trackUri: string) {
  if (!roomState.value.isPlaying) return

  spotifyPlayer.position.value = roomState.value.position

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
  /* if (!deviceId) {
    error.value = 'Spotify device not ready. Reconnect Spotify.'
    return
  } */
  if (!spotifyPlayer.deviceId.value) return

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    if (!roomState.value.isPlaying) return

    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 500 * attempt))
    }

    const playRes = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: roomState.value.position
        })
      }
    )
    if (playRes.ok) return

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
  }

  error.value = 'Spotify device did not become ready. Try again.'
}

async function addSongByVideoId(videoId: string) {
  addingSong.value = true
  error.value = ''
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: 'POST',
      body: { videoId, addedBy: 'Guest' }
    })
    await fetchRoomState()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to add song.'
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
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Failed to add song.'
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
  } catch (e: any) {
    error.value
      = e?.data?.statusMessage || e?.message || 'Failed to add SoundCloud track.'
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

async function togglePlay() {
  if (!isHost.value || !hostData.value?.hostToken) return
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
        } else if (
          (song.source === 'youtube' || song.source === 'soundcloud')
          && song.url
        ) {
          spotifyPlayer.pause()
          const startTime = roomState.value.position > 0
            ? roomState.value.position / 1000
            : undefined
          audioPlayerRef.value?.play(song.url, startTime)
        }
      }
    } else {
      spotifyPlayer.pause()
      audioPlayerRef.value?.pause()
    }
  } catch (e: any) {
    error.value = e?.message || 'Playback failed.'
  }
}

async function skip() {
  if (!isHost.value || !hostData.value?.hostToken) return

  audioPlayerRef.value?.pause()

  try {
    const res = await $fetch<{
      currentSong: SongData | null
      isPlaying: boolean
    }>(`/api/room/${roomId}/skip`, {
      method: 'POST',
      body: { hostToken: hostData.value.hostToken }
    })
    roomState.value.currentSong = res.currentSong
    roomState.value.isPlaying = res.isPlaying
    if (res.currentSong) {
      lastSongId = res.currentSong.id
      handleSongChange(res.currentSong)
    } else {
      spotifyPlayer.pause()
    }
  } catch {
    error.value = 'Failed to skip.'
  }
}

function onAudioEnded() {
  skip()
}

function onAudioError(msg: string) {
  error.value = msg
  skip()
}

async function onAudioExpired() {
  const song = roomState.value.currentSong
  if (!song || !hostData.value?.hostToken) {
    skip()
    return
  }

  const body: Record<string, string> = { hostToken: hostData.value.hostToken }
  if (song.trackUrl) {
    body.trackUrl = song.trackUrl
  } else if (song.videoId) {
    body.videoId = song.videoId
  } else {
    skip()
    return
  }

  try {
    const refreshed = await $fetch<{ url: string, title: string }>(
      `/api/room/${roomId}/audio/refresh`,
      {
        method: 'POST',
        body
      }
    )
    song.url = refreshed.url
    if (userActivated.value) {
      audioPlayerRef.value?.play(refreshed.url)
    }
  } catch {
    skip()
  }
}

onMounted(async () => {
  try {
    const raw = localStorage.getItem('quefy-host')
    if (raw) hostData.value = JSON.parse(raw)
  } catch {}

  try {
    roomState.value = await $fetch<RoomState>(`/api/room/${roomId}`)
  } catch {
    notFound.value = true
    loading.value = false
    return
  }
  loading.value = false
  connectSSE()

  if (isHost.value) {
    positionTimer = setInterval(reportPosition, 5000)
  }

  document.addEventListener('pointerdown', activateUser, { once: true })
  document.addEventListener('keydown', activateUser, { once: true })

  window.addEventListener('beforeunload', () => {
    pageLeaving = true
  })
})

onUnmounted(() => {
  pageLeaving = true
  if (isHost.value && hostData.value?.hostToken) {
    $fetch(`/api/room/${roomId}/spotify-disconnect`, {
      method: 'POST',
      body: { hostToken: hostData.value.hostToken }
    }).catch(() => {})
  }
  eventSource?.close()
  if (pollTimer) clearInterval(pollTimer)
  if (positionTimer) clearInterval(positionTimer)
  spotifyPlayer.destroy()
})

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
</script>
