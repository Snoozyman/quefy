import { describe, expect, test } from 'bun:test'
import { createSpotifyStarter } from '../../app/playback/spotifyStart'
import { fakeSpotify } from './fakes'

type Call = { url: string; body: unknown }

function setup({
  responses = [200],
  token = 'tok' as string | null,
  refreshOk = false,
  playing = true,
  trackUri = 'spotify:track:a'
} = {}) {
  const spotify = fakeSpotify()
  const calls: Call[] = []
  const errors: string[] = []
  const queue = [...responses]
  const starter = createSpotifyStarter({
    player: spotify.player,
    getAccessToken: () => token,
    refreshToken: async () => refreshOk,
    isRoomPlaying: () => playing,
    currentTrackUri: () => trackUri,
    roomPosition: () => 42_000,
    onError: (m) => errors.push(m),
    sleep: async () => {},
    confirmDelayMs: 5,
    fetch: (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body ?? 'null')) })
      const status = url.endsWith('/me/player') ? 204 : (queue.shift() ?? 200)
      return new Response(status === 204 ? null : 'nope', { status })
    }) as typeof fetch
  })
  return { starter, spotify, calls, errors }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('createSpotifyStarter', () => {
  test('plays the track on this device from the room position', async () => {
    const { starter, calls, errors, spotify } = setup()
    await starter.start('spotify:track:a')
    expect(calls).toEqual([
      {
        url: 'https://api.spotify.com/v1/me/player/play?device_id=device-1',
        body: { uris: ['spotify:track:a'], position_ms: 42_000 }
      }
    ])
    expect(spotify.position.value).toBe(42_000)
    expect(errors).toEqual([])
  })

  test('re-sends a start that reports a false pause, at most twice', async () => {
    const { starter, calls, spotify } = setup()
    await starter.start('spotify:track:a')
    // The SDK has the track but says paused (the first-track quirk).
    spotify.state.value = { uri: 'spotify:track:a', paused: true }
    spotify.position.value = 3_000
    await wait(60)
    expect(calls).toHaveLength(3)
    expect(calls[1]?.body).toEqual({
      uris: ['spotify:track:a'],
      position_ms: 3_000
    })
  })

  test('does not re-send once Spotify is really playing', async () => {
    const { starter, calls, spotify } = setup()
    await starter.start('spotify:track:a')
    spotify.state.value = { uri: 'spotify:track:a', paused: false }
    await wait(20)
    expect(calls).toHaveLength(1)
  })

  test('on 404 makes this the active device, then retries', async () => {
    const { starter, calls, errors } = setup({ responses: [404, 200] })
    await starter.start('spotify:track:a')
    expect(calls.map((c) => c.url)).toEqual([
      'https://api.spotify.com/v1/me/player/play?device_id=device-1',
      'https://api.spotify.com/v1/me/player',
      'https://api.spotify.com/v1/me/player/play?device_id=device-1'
    ])
    expect(calls[1]?.body).toEqual({ device_ids: ['device-1'], play: false })
    expect(errors).toEqual([])
  })

  test('reports Premium being required on 403', async () => {
    const { starter, errors } = setup({ responses: [403] })
    await starter.start('spotify:track:a')
    expect(errors[0]).toStartWith('Spotify Premium required')
  })

  test('reports an expired session when the token cannot be refreshed', async () => {
    const { starter, calls, errors } = setup({ token: null })
    await starter.start('spotify:track:a')
    expect(calls).toEqual([])
    expect(errors).toEqual(['Spotify session expired. Reconnect Spotify.'])
  })

  test('does nothing while the room is paused', async () => {
    const { starter, calls } = setup({ playing: false })
    await starter.start('spotify:track:a')
    expect(calls).toEqual([])
  })

  test('gives up after repeated 404s', async () => {
    const { starter, errors } = setup({ responses: [404, 404, 404, 404] })
    await starter.start('spotify:track:a')
    expect(errors).toEqual(['Spotify device did not become ready. Try again.'])
  })
})
