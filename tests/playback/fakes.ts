import { computed, nextTick, ref } from 'vue'
import type { RoomState, SongData } from '../../shared/types/room'
import type {
  AudioPlayerHandle,
  PlaybackApi,
  PlayStateResponse,
  SpotifyPlayerLike
} from '../../app/playback/types'

let nextId = 0

export function song(
  source: SongData['source'],
  extra: Partial<SongData> = {}
): SongData {
  const id = extra.id ?? `s${++nextId}`
  return {
    id,
    source,
    title: `Song ${id}`,
    addedBy: 'test',
    addedAt: 0,
    ...(source === 'youtube' ? { videoId: `v-${id}` } : {}),
    ...(source === 'soundcloud' ? { trackUrl: `https://soundcloud.com/a/${id}` } : {}),
    ...(source === 'spotify' ? { trackUri: `spotify:track:${id}` } : {}),
    ...extra
  }
}

export function roomState(
  current: SongData | null,
  queue: SongData[] = [],
  isPlaying = true
) {
  return ref<RoomState>({
    id: 'ROOM',
    title: 'Test',
    currentSong: current,
    queue,
    isPlaying,
    spotifyConnected: true,
    createdAt: 0,
    position: 0
  })
}

/** An `<audio>` player that records calls; `playing` follows play/pause. */
export function fakeAudio() {
  const playing = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const calls: Array<[string, ...unknown[]]> = []
  const handle: AudioPlayerHandle = {
    play: (url, startTime) => {
      calls.push(['play', url, startTime])
      playing.value = true
      duration.value = 200
    },
    pause: (opts) => {
      calls.push(['pause', opts?.keepAlive ?? false])
      playing.value = false
    },
    resume: () => {
      calls.push(['resume'])
      playing.value = true
    },
    seek: (t) => {
      calls.push(['seek', t])
    },
    unlockSilentAudio: () => {},
    state: { playing, currentTime, duration }
  }
  return { handle, calls, playing, currentTime, duration }
}

/** A Spotify SDK player that records calls. */
export function fakeSpotify() {
  const state = ref<{ uri: string; paused: boolean } | null>(null)
  const position = ref(0)
  const durationMs = ref(0)
  const calls: Array<[string, ...unknown[]]> = []
  let onTrackEnd: (() => void) | null = null
  const player: SpotifyPlayerLike = {
    deviceId: ref('device-1'),
    paused: computed(() => state.value?.paused ?? true),
    position,
    duration: computed(() => durationMs.value),
    currentTrack: computed(() => (state.value ? { uri: state.value.uri } : null)),
    play: async () => {
      calls.push(['play'])
      if (state.value) state.value = { ...state.value, paused: false }
    },
    pause: async () => {
      calls.push(['pause'])
      if (state.value) state.value = { ...state.value, paused: true }
    },
    seek: (ms) => {
      calls.push(['seek', ms])
    },
    setOnTrackEnd: (cb) => {
      onTrackEnd = cb
    },
    resetErrors: () => {}
  }
  return {
    player,
    calls,
    state,
    position,
    durationMs,
    trackEnd: () => onTrackEnd?.()
  }
}

/**
 * A room API backed by an in-memory room, like the server: toggle flips
 * play state (starting the queue from idle), skip moves to the next song.
 */
export function fakeApi(room: ReturnType<typeof roomState>) {
  const server = {
    currentSong: room.value.currentSong,
    queue: [...room.value.queue],
    isPlaying: room.value.isPlaying
  }
  const calls: Array<[string, ...unknown[]]> = []
  let refresh: (source: unknown) => Promise<{
    url: string
    title: string
    durationMs: number
  }> = async (source) => ({
    url: `https://stream/${JSON.stringify(source)}`,
    title: 'Resolved',
    durationMs: 1000
  })
  const snapshot = (): PlayStateResponse => ({
    isPlaying: server.isPlaying,
    currentSong: server.currentSong ? { ...server.currentSong } : null
  })
  const api: PlaybackApi = {
    togglePlay: async () => {
      calls.push(['togglePlay'])
      if (!server.currentSong && server.queue.length) {
        server.currentSong = server.queue.shift() ?? null
        server.isPlaying = true
      } else {
        server.isPlaying = !server.isPlaying
      }
      return snapshot()
    },
    skip: async () => {
      calls.push(['skip'])
      server.currentSong = server.queue.shift() ?? null
      server.isPlaying = !!server.currentSong
      return snapshot()
    },
    refreshAudio: (source) => {
      calls.push(['refreshAudio', source])
      return refresh(source)
    },
    reportPosition: async (position) => {
      calls.push(['reportPosition', position])
    }
  }
  return {
    api,
    calls,
    server,
    setRefresh: (fn: typeof refresh) => {
      refresh = fn
    }
  }
}

/** Let promise chains and Vue watchers run. */
export async function flush(times = 5) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
    await nextTick()
  }
}

export const names = (calls: Array<[string, ...unknown[]]>) =>
  calls.map((c) => c[0])
