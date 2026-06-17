interface SpotifyPlayerInstance {
  play: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
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
  trackWindow: {
    currentTrack: {
      id: string
      uri: string
      name: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string }> }
      durationMs: number
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
const playerState = ref<SpotifyPlaybackState | null>(null)
const currentTrack = computed(() => playerState.value?.trackWindow?.currentTrack ?? null)
const paused = computed(() => playerState.value?.paused ?? true)
const position = computed(() => playerState.value?.position ?? 0)
const duration = computed(() => playerState.value?.duration ?? 0)

let sdkLoaded = false
let loadResolve: (() => void) | null = null
let loadPromise: Promise<void> | null = null

let playbackErrorCount = 0
let playbackErrorWindow: number[] = []
let destroyedByErrors = false

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

      return new Promise((resolve) => {
        const p = new window.Spotify!.Player({
          name: 'Quefy Room Player',
          getOAuthToken: (cb: (token: string) => void) => { cb(accessToken) },
          volume: 0.33
        })

        p.addListener('ready', ({ device_id }: { device_id: string }) => {
          deviceId.value = device_id
          isReady.value = true
          isConnecting.value = false
          resolve(true)
        })

        p.addListener('not_ready', () => { isReady.value = false })

        p.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
          playerState.value = state
        })

        p.addListener('initialization_error', (e: { message: string }) => {
          error.value = `Spotify init error: ${e.message}`
          isConnecting.value = false
          resolve(false)
        })

        p.addListener('authentication_error', (e: { message: string }) => {
          error.value = `Spotify auth error: ${e.message}`
          isConnecting.value = false
          resolve(false)
        })

        p.addListener('account_error', (e: { message: string }) => {
          error.value = `Spotify Premium required: ${e.message}`
          isConnecting.value = false
          resolve(false)
        })

        p.addListener('playback_error', () => {
          if (destroyedByErrors) return

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

        p.connect()
        player.value = p
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to initialize Spotify player'
      isConnecting.value = false
      return false
    }
  }

  async function play(): Promise<void> {
    try { await player.value?.resume() } catch {}
  }

  async function pause(): Promise<void> {
    try { await player.value?.pause() } catch {}
  }

  async function seek(positionMs: number): Promise<void> {
    try { await player.value?.seek(positionMs) } catch {}
  }

  async function nextTrack(): Promise<void> {
    try { await player.value?.nextTrack() } catch {}
  }

  function destroy() {
    playbackErrorCount = 0
    playbackErrorWindow = []
    destroyedByErrors = false
    player.value?.disconnect()
    player.value = null
    isReady.value = false
    deviceId.value = ''
    playerState.value = null
  }

  return {
    deviceId, isReady, isConnecting, error,
    playerState, currentTrack, paused, position, duration,
    init, play, pause, seek, nextTrack, destroy
  }
}
