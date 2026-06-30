import { useSpotifyAuth } from './useSpotifyAuth'

interface SpotifyPlayerInstance {
  play: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  getVolume: () => Promise<number>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  getCurrentState: () => Promise<SpotifyPlaybackState | null>
  disconnect: () => void
  connect: () => Promise<boolean>
  on: (event: string, cb: (...args: any[]) => void) => void
  addListener: (event: string, cb: (...args: any[]) => void) => void
  name: string
}

interface SpotifyPlaybackState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      artists: Array<{ name: string }>
      album: { name: string, images: Array<{ url: string }> }
      duration_ms: number
    } | null
  }
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: {
      Player: new (config: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayerInstance
    }
  }
}

const player = ref<SpotifyPlayerInstance | null>(null)
const deviceId = ref<string>('')
const isReady = ref(false)
const isConnecting = ref(false)
const error = ref<string>('')
const volume = ref(0.33)
const playerState = ref<SpotifyPlaybackState | null>(null)
const currentTrack = computed(() => playerState.value?.track_window?.current_track ?? null)
const paused = computed(() => playerState.value?.paused ?? true)
const position = ref(0)
const duration = computed(() => playerState.value?.duration ?? 0)

let sdkLoaded = false
let loadResolve: (() => void) | null = null
let loadPromise: Promise<void> | null = null

let playbackErrorCount = 0
let playbackErrorWindow: number[] = []
let destroyedByErrors = false
let lastSyncPosition = 0
let lastSyncTime = 0
let tickTimer: ReturnType<typeof setInterval> | null = null
let wasPlaying = false
let onTrackEnd: (() => void) | null = null

function startTick() {
  stopTick()
  tickTimer = setInterval(() => {
    if (paused.value || !playerState.value) return
    const elapsed = Date.now() - lastSyncTime
    position.value = lastSyncPosition + elapsed
  }, 250)
}

function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function isFirefox(): boolean {
  return navigator.userAgent.includes('Firefox')
}

function loadSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    loadResolve = resolve
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  })

  window.onSpotifyWebPlaybackSDKReady = () => {
    sdkLoaded = true
    loadResolve?.()
  }

  return loadPromise
}

export function useSpotifyPlayer() {
  async function init(accessToken: string): Promise<boolean> {
    if (player.value) {
      await player.value.disconnect()
      player.value = null
    }

    destroyedByErrors = false
    playbackErrorCount = 0
    playbackErrorWindow = []

    if (isFirefox()) {
      error.value = 'Spotify Web Playback SDK does not work in Firefox. Use Chrome or Edge.'
      return true
    }

    isConnecting.value = true
    error.value = ''
    isReady.value = false

    try {
      await loadSDK()

      if (!window.Spotify) {
        throw new Error('Spotify Web Playback SDK failed to load')
      }

      const p = new window.Spotify!.Player({
        name: 'Quefy Room Player',
        getOAuthToken: async (cb: (token: string) => void) => {
          const auth = useSpotifyAuth()
          let token = auth.getAccessToken()
          if (!token) {
            try { await auth.refreshToken() } catch {}
            token = auth.getAccessToken()
          }
          cb(token ?? accessToken)
        },
        volume: 0.33
      })
      player.value = p

      let readyResolve: (ok: boolean) => void
      const readyPromise = new Promise<boolean>((resolve) => { readyResolve = resolve })

      p.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceId.value = device_id
        readyResolve(true)
      })

      p.addListener('not_ready', () => { isReady.value = false })

      p.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
        playerState.value = state
        if (state) {
          if (state.paused) {
            stopTick()
            if (wasPlaying && state.duration > 0 && (state.position >= state.duration - 1500 || position.value >= state.duration - 1500)) {
              onTrackEnd?.()
            }
            wasPlaying = false
          } else {
            wasPlaying = true
            startTick()
          }
          lastSyncPosition = state.position
          lastSyncTime = Date.now()
          position.value = state.position
        }
      })

      p.addListener('initialization_error', (e: { message: string }) => {
        error.value = `Spotify init error: ${e.message}`
        readyResolve(false)
      })

      p.addListener('authentication_error', (e: { message: string }) => {
        error.value = `Spotify auth error: ${e.message}`
        readyResolve(false)
      })

      p.addListener('account_error', (e: { message: string }) => {
        error.value = `Spotify Premium required: ${e.message}`
        readyResolve(false)
      })

      p.addListener('playback_error', () => {
        if (destroyedByErrors) return
        if (!playerState.value || playerState.value.paused) return

        const now = Date.now()
        playbackErrorWindow = playbackErrorWindow.filter(t => now - t < 10000)
        playbackErrorWindow.push(now)
        playbackErrorCount++

        if (playbackErrorWindow.length >= 3) {
          destroyedByErrors = true
          p.disconnect()
          player.value = null
          isReady.value = false
          deviceId.value = ''
          playerState.value = null
          error.value = 'Spotify playback keeps failing. Try a different track or check your account/region.'
        }
      })

      const connected = await p.connect()
      if (!connected) {
        error.value = 'Spotify device failed to register'
        isConnecting.value = false
        return false
      }

      const ready = await readyPromise
      if (!ready) {
        isConnecting.value = false
        return false
      }

      let found = false
      for (let attempt = 0; attempt < 3; attempt++) {
        const devices = await listDevices(accessToken)
        found = devices.some((d: { id: string }) => d.id === deviceId.value)
        if (found) break
        if (attempt < 2) await new Promise(r => setTimeout(r, 500))
      }
      if (!found) {
        error.value = 'Spotify device was created but not found in your available devices. Try opening Spotify and playing a song first.'
        isConnecting.value = false
        return false
      }

      isReady.value = true
      isConnecting.value = false
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to initialize Spotify player'
      isConnecting.value = false
      return false
    }
  }

  async function listDevices(token: string): Promise<Array<{ id: string }>> {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return []
      const data = await res.json() as { devices: Array<{ id: string }> }
      return data.devices ?? []
    } catch {
      return []
    }
  }

  async function play(): Promise<void> {
    try { await player.value?.resume() } catch {}
  }

  async function pause(): Promise<void> {
    try { await player.value?.pause() } catch {}
  }

  async function seek(positionMs: number): Promise<void> {
    try {
      await player.value?.seek(positionMs)
      lastSyncPosition = positionMs
      lastSyncTime = Date.now()
      position.value = positionMs
    } catch {}
  }

  async function nextTrack(): Promise<void> {
    try { await player.value?.nextTrack() } catch {}
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    player.value?.setVolume(volume.value).catch(() => {})
  }

  async function getVolume(): Promise<number> {
    try {
      const v = await player.value?.getVolume()
      if (typeof v === 'number' && v >= 0 && v <= 1) {
        volume.value = v
      }
      return volume.value
    } catch {
      return volume.value
    }
  }

  function destroy() {
    stopTick()
    playbackErrorCount = 0
    playbackErrorWindow = []
    destroyedByErrors = false
    player.value?.disconnect()
    player.value = null
    isReady.value = false
    deviceId.value = ''
    playerState.value = null
  }

  function resetErrors() {
    playbackErrorCount = 0
    playbackErrorWindow = []
    destroyedByErrors = false
  }

  function setOnTrackEnd(cb: () => void) {
    onTrackEnd = cb
  }

  return {
    deviceId, isReady, isConnecting, error, volume,
    playerState, currentTrack, paused, position, duration,
    init, play, pause, seek, nextTrack, setVolume, destroy, resetErrors, setOnTrackEnd
  }
}
