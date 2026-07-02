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
        <RoomHeader
          :room-id="roomId"
          :room-state="roomState"
        />
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
                && spotifyPlayer.currentTrack.value.uri === roomState.currentSong.trackUri
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
          <RoomSettingsTab
            :is-host="isHost"
            @export="exportQueue"
            @delete="deleteRoom"
          />
        </div>
      </template>
    </UCard>

    <div
      v-if="isHost"
      class="flex items-center gap-2"
    >
      <UButton
        size="sm"
        variant="outline"
        :icon="roomState.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        :disabled="playDisabled"
        @click="togglePlay"
      >
        {{ roomState.isPlaying ? 'Pause' : 'Play' }}
      </UButton>
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-skip-forward"
        :disabled="!roomState.currentSong"
        @click="skip"
      >
        Skip
      </UButton>
    </div>

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
import type { SongData } from '#shared/types/room'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const { roomState, loading, notFound, error, isHost, hostData, fetchRoomState } = useRoomState(computed(() => roomId))
const spotifyAuth = useSpotifyAuth()
const spotifyPlayer = useSpotifyPlayer()

const addingSong = ref(false)
const activeTab = ref<'player' | 'settings'>('player')

const playDisabled = computed(
  () => !roomState.value.queue.length && !roomState.value.currentSong
)
const currentSongIsAudio = computed(
  () =>
    roomState.value.currentSong?.source === 'youtube'
    || roomState.value.currentSong?.source === 'soundcloud'
)

const audioPlayerRef = ref<{
  play: (url: string, startTime?: number) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  state: { playing: { value: boolean }, currentTime: { value: number }, duration: { value: number }, volume: { value: number }, seekValue: { value: number } }
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
      artwork: song.albumImageUrl
        ? [{ src: song.albumImageUrl, sizes: '512x512', type: 'image/png' }]
        : []
    })

    navigator.mediaSession.playbackState = roomState.value.isPlaying ? 'playing' : 'paused'

    navigator.mediaSession.setActionHandler('play', () => {
      if (!roomState.value.isPlaying) {
        togglePlay()
      }
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      if (roomState.value.isPlaying) {
        togglePlay()
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
  navigator.mediaSession.playbackState = roomState.value.isPlaying ? 'playing' : 'paused'
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
    durationSeconds = Math.max(0, audioPlayerRef.value?.state.duration.value ?? 0)
    positionSeconds = Math.max(0, audioPlayerRef.value?.state.currentTime.value ?? 0)
  }

  if (!isFinite(durationSeconds) || durationSeconds <= 0) return

  mediaSessionWithPosition.setPositionState({
    duration: durationSeconds,
    playbackRate: 1,
    position: Math.min(positionSeconds, durationSeconds)
  })
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

let lastSongId: string | null = null
let currentPlayingId = ''

async function handleSongChange(song: SongData) {
  if (!isHost.value) return
  if (song.id === currentPlayingId) return
  currentPlayingId = song.id
  if (song.source === 'spotify' && song.trackUri) {
    audioPlayerRef.value?.pause()
    spotifyPlayer.setOnTrackEnd(skip)
    await transferSpotifyPlayback(song.trackUri)
  }
  if ((song.source === 'youtube' || song.source === 'soundcloud') && song.url) {
    spotifyPlayer.setOnTrackEnd(null)
    spotifyPlayer.resetErrors()
    await spotifyPlayer.pause()
    if (roomState.value.isPlaying) {
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

let positionTimer: ReturnType<typeof setInterval> | null = null
let lastKnownPosition = 0

async function reportPosition() {
  if (!isHost.value || !hostData.value?.hostToken) return

  const song = roomState.value.currentSong
  if (!song) return

  const locallyPlaying = song.source === 'spotify'
    ? !spotifyPlayer.paused.value
    : (audioPlayerRef.value?.state.playing.value ?? false)

  if (!locallyPlaying) return

  let position = 0
  if (song.source === 'spotify') {
    position = spotifyPlayer.position.value
  } else {
    position = Math.round((audioPlayerRef.value?.state.currentTime.value ?? 0) * 1000)
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

watch(
  () => [spotifyPlayer.position.value, spotifyPlayer.duration.value, audioPlayerRef.value?.state.currentTime.value, audioPlayerRef.value?.state.duration.value],
  () => {
    updateMediaSessionPosition(roomState.value.currentSong)
  }
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
  if (!spotifyPlayer.deviceId.value) return

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ device_ids: [deviceId], play: false })
  })

  for (let attempt = 0; attempt < 4; attempt++) {
    if (!roomState.value.isPlaying) return

    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1000 * attempt))
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
    error.value = e?.data?.statusMessage || e?.message || 'Failed to add SoundCloud track.'
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
        } else if (song.source === 'youtube' || song.source === 'soundcloud') {
          spotifyPlayer.pause()
          const dur = audioPlayerRef.value?.state.duration.value ?? 0
          if (dur > 0) {
            audioPlayerRef.value!.resume()
          } else if (song.url) {
            const startTime = roomState.value.position > 0
              ? roomState.value.position / 1000
              : undefined
            audioPlayerRef.value?.play(song.url, startTime)
          }
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
      void handleSongChange(res.currentSong)
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

  document.addEventListener('pointerdown', activateUser, { once: true })
  document.addEventListener('keydown', activateUser, { once: true })
})

onUnmounted(() => {
  if (isHost.value && hostData.value?.hostToken && lastKnownPosition > 0) {
    const blob = new Blob([JSON.stringify({
      hostToken: hostData.value.hostToken,
      position: lastKnownPosition
    })], { type: 'application/json' })
    navigator.sendBeacon(`/api/room/${roomId}/position`, blob)
  }

  if (positionTimer) clearInterval(positionTimer)
  spotifyPlayer.destroy()
})
</script>
