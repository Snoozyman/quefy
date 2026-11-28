import type { SpotifyPlayerLike } from './types'

export interface SpotifyStartDeps {
  player: SpotifyPlayerLike
  getAccessToken: () => string | null
  refreshToken: () => Promise<boolean>
  /** Whether the room is (still) playing. */
  isRoomPlaying: () => boolean
  /** The room's current song's track URI. */
  currentTrackUri: () => string | undefined
  /** The room's position (ms), used when no position is given. */
  roomPosition: () => number
  onError: (message: string) => void
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /** How long after a start to check it really started. */
  confirmDelayMs?: number
}

export interface SpotifyStartOptions {
  positionMs?: number
  /** How many more times a start that reports "paused" is re-sent. */
  retriesLeft?: number
}

const API = 'https://api.spotify.com/v1/me/player'

/**
 * Starts a track on this browser's Web Playback SDK device.
 *
 * The first track a freshly connected SDK player plays reports "paused"
 * about a second in and really stops ~30s later. An SDK resume() without a
 * click doesn't help, but re-sending the play request does (verified in
 * Chrome), so each start is checked shortly after and re-sent if needed.
 */
export function createSpotifyStarter(deps: SpotifyStartDeps) {
  const doFetch = deps.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const confirmDelayMs = deps.confirmDelayMs ?? 2500
  const { player } = deps

  function confirmStarted(trackUri: string, retriesLeft: number) {
    setTimeout(() => {
      if (!deps.isRoomPlaying() || deps.currentTrackUri() !== trackUri) return
      if (player.currentTrack.value?.uri !== trackUri) return
      if (!player.paused.value || retriesLeft <= 0) return
      void start(trackUri, {
        positionMs: player.position.value,
        retriesLeft: retriesLeft - 1
      })
    }, confirmDelayMs)
  }

  async function token(): Promise<string | null> {
    const current = deps.getAccessToken()
    if (current) return current
    if (!(await deps.refreshToken())) return null
    return deps.getAccessToken()
  }

  async function start(trackUri: string, options: SpotifyStartOptions = {}) {
    const { positionMs = deps.roomPosition(), retriesLeft = 2 } = options
    if (!deps.isRoomPlaying()) return

    player.position.value = positionMs

    const accessToken = await token()
    if (!accessToken) {
      deps.onError('Spotify session expired. Reconnect Spotify.')
      return
    }

    const deviceId = player.deviceId.value
    if (!deviceId) return

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    // `play?device_id=` already moves playback to this device. A separate
    // "transfer with play:false" first is not just redundant: Spotify applies
    // it asynchronously, and its late "paused" state can land after playback
    // started, so the SDK reports paused while audio is playing.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!deps.isRoomPlaying()) return
      if (attempt > 0) await sleep(1000 * attempt)

      const res = await doFetch(`${API}/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ uris: [trackUri], position_ms: positionMs })
      })
      if (res.ok) {
        confirmStarted(trackUri, retriesLeft)
        return
      }

      if (res.status === 403) {
        const body = await res.text().catch(() => '')
        deps.onError(`Spotify Premium required: ${body.slice(0, 200)}`)
        return
      }
      if (res.status !== 404) {
        const body = await res.text().catch(() => '')
        deps.onError(`Spotify play failed: ${body.slice(0, 200)}`)
        return
      }

      // 404: Spotify doesn't know this device yet (it only just registered).
      // Make it the active device, then retry the play request.
      await doFetch(API, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ device_ids: [deviceId], play: false })
      }).catch(() => {})
    }

    deps.onError('Spotify device did not become ready. Try again.')
  }

  return { start }
}

export type SpotifyStarter = ReturnType<typeof createSpotifyStarter>
