import { describe, expect, test } from 'bun:test'
import { ref } from 'vue'
import type { SongData } from '../../shared/types/room'
import {
  RETRY_LIMIT,
  useRoomPlayback
} from '../../app/playback/useRoomPlayback'
import {
  fakeApi,
  fakeAudio,
  fakeSpotify,
  flush,
  names,
  roomState,
  song
} from './fakes'

function setup(
  current: SongData | null,
  queue: SongData[] = [],
  { isPlaying = true, isHost = true } = {}
) {
  const room = roomState(current, queue, isPlaying)
  const audio = fakeAudio()
  const spotify = fakeSpotify()
  const server = fakeApi(room)
  const started: string[] = []
  const error = ref('')
  const playback = useRoomPlayback({
    roomState: room,
    isHost: ref(isHost),
    hasHostToken: () => isHost,
    error,
    audio: () => audio.handle,
    spotify: spotify.player,
    // Like the real starter: nothing happens while the room is paused.
    startSpotify: async (uri) => {
      if (!room.value.isPlaying) return
      started.push(uri)
      spotify.state.value = { uri, paused: false }
    },
    api: server.api,
    userActivated: ref(true)
  })
  return { room, audio, spotify, server, started, error, playback }
}

/** Move the room to `next`, as a live update or the server would. */
async function changeSong(t: ReturnType<typeof setup>, next: SongData) {
  t.room.value.currentSong = next
  await flush()
}

describe('song changes', () => {
  test('an audio song with a URL plays on <audio> and pauses Spotify', async () => {
    const t = setup(null)
    const next = song('youtube', { url: 'https://stream/a' })
    await changeSong(t, next)
    expect(names(t.spotify.calls)).toContain('pause')
    expect(t.audio.calls).toContainEqual(['play', 'https://stream/a', undefined])
  })

  test('a Spotify song pauses <audio> and starts Spotify', async () => {
    const t = setup(null)
    const next = song('spotify')
    await changeSong(t, next)
    expect(names(t.audio.calls)).toEqual(['pause'])
    expect(t.started).toEqual([next.trackUri!])
  })

  test('an audio song without a URL is resolved first, then played', async () => {
    const t = setup(null)
    const next = song('youtube')
    await changeSong(t, next)
    expect(t.server.calls).toContainEqual([
      'refreshAudio',
      { videoId: next.videoId }
    ])
    expect(t.audio.calls.find((c) => c[0] === 'play')?.[1]).toStartWith(
      'https://stream/'
    )
    expect(t.error.value).toBe('')
  })

  test('a song that cannot be resolved shows the error and is skipped', async () => {
    const t = setup(null, [song('youtube', { url: 'https://stream/b' })])
    t.server.setRefresh(async () => {
      throw new Error('Video unavailable')
    })
    await changeSong(t, song('youtube'))
    expect(t.error.value).toContain('Video unavailable')
    expect(names(t.server.calls)).toContain('skip')
  })

  test('a song resolved after the room was paused does not start', async () => {
    const t = setup(null)
    let release!: () => void
    t.server.setRefresh(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({ url: 'https://late', title: 'x', durationMs: 1 })
        })
    )
    void changeSong(t, song('youtube'))
    await flush()
    t.room.value.isPlaying = false
    release()
    await flush()
    expect(names(t.audio.calls)).not.toContain('play')
  })
})

describe('loading state', () => {
  test('is on while an audio song starts and off once it plays', async () => {
    const t = setup(null)
    let release!: () => void
    t.server.setRefresh(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({ url: 'https://s', title: 'x', durationMs: 1 })
        })
    )
    void changeSong(t, song('youtube'))
    await flush()
    expect(t.playback.audioLoading.value).toBe(true)
    release()
    await flush()
    expect(t.audio.playing.value).toBe(true)
    expect(t.playback.audioLoading.value).toBe(false)
  })

  test('ends when the room is paused', async () => {
    const t = setup(null)
    t.server.setRefresh(() => new Promise(() => {}))
    void changeSong(t, song('youtube'))
    await flush()
    t.room.value.isPlaying = false
    await flush()
    expect(t.playback.audioLoading.value).toBe(false)
  })
})

describe('togglePlay', () => {
  test('pauses both players when the room pauses', async () => {
    const current = song('youtube', { url: 'https://s' })
    const t = setup(current)
    t.audio.playing.value = true
    await t.playback.togglePlay()
    expect(t.room.value.isPlaying).toBe(false)
    expect(names(t.audio.calls)).toContain('pause')
    expect(names(t.spotify.calls)).toContain('pause')
  })

  test('room playing but silent here: Play starts it locally, room unchanged', async () => {
    const current = song('youtube', { url: 'https://s' })
    const t = setup(current)
    await t.playback.togglePlay()
    expect(t.server.calls).toEqual([])
    expect(t.audio.calls).toContainEqual(['play', 'https://s', undefined])
  })

  test('while a song is loading the button pauses the room', async () => {
    const t = setup(null)
    t.server.setRefresh(() => new Promise(() => {}))
    void changeSong(t, song('youtube'))
    await flush()
    await t.playback.togglePlay()
    expect(names(t.server.calls)).toContain('togglePlay')
    expect(t.room.value.isPlaying).toBe(false)
  })

  test('resuming a Spotify song the SDK still holds uses play(), not a new start', async () => {
    const current = song('spotify')
    const t = setup(null, [], { isPlaying: false })
    t.server.server.currentSong = current
    await changeSong(t, current) // the room loads with this song, paused
    t.spotify.state.value = { uri: current.trackUri!, paused: true }
    await t.playback.togglePlay()
    expect(t.room.value.isPlaying).toBe(true)
    expect(names(t.spotify.calls)).toContain('play')
    expect(t.started).toEqual([])
  })

  test('play from idle starts the first queued song', async () => {
    const first = song('youtube', { url: 'https://first' })
    const t = setup(null, [first], { isPlaying: false })
    await t.playback.togglePlay()
    await flush()
    expect(t.room.value.currentSong?.id).toBe(first.id)
    expect(t.audio.calls).toContainEqual(['play', 'https://first', undefined])
  })
})

describe('skip and track end', () => {
  test('skip keeps the iOS audio session alive and starts the next song', async () => {
    const next = song('youtube', { url: 'https://next' })
    const t = setup(song('youtube', { url: 'https://cur' }), [next])
    await t.playback.skip()
    await flush()
    expect(t.audio.calls[0]).toEqual(['pause', true])
    expect(t.room.value.currentSong?.id).toBe(next.id)
    expect(t.audio.calls).toContainEqual(['play', 'https://next', undefined])
  })

  test('skip at the end of the queue stops both players', async () => {
    const t = setup(song('youtube', { url: 'https://cur' }))
    await t.playback.skip()
    expect(t.room.value.currentSong).toBeNull()
    expect(t.audio.calls.at(-1)).toEqual(['pause', false])
    expect(names(t.spotify.calls)).toContain('pause')
  })

  test('a finished song with a known next URL starts it before the server answers', async () => {
    const next = song('youtube', { url: 'https://next' })
    const t = setup(song('youtube', { url: 'https://cur' }), [next])
    t.playback.onAudioEnded()
    await flush()
    // Started locally first, then the server skip was adopted.
    expect(t.audio.calls[0]).toEqual(['play', 'https://next', undefined])
    expect(names(t.server.calls)).toEqual(['skip'])
    expect(t.room.value.currentSong?.id).toBe(next.id)
    expect(t.room.value.currentSong?.url).toBe('https://next')
    // No second start of the same song.
    expect(t.audio.calls.filter((c) => c[0] === 'play')).toHaveLength(1)
  })

  test('a finished song without a known next URL goes through the server', async () => {
    const next = song('spotify')
    const t = setup(song('youtube', { url: 'https://cur' }), [next])
    t.playback.onAudioEnded()
    await flush()
    expect(names(t.server.calls)).toEqual(['skip'])
    expect(t.started).toEqual([next.trackUri!])
  })

  test('the Spotify track end callback skips', async () => {
    const next = song('youtube', { url: 'https://next' })
    const t = setup(null, [next])
    await changeSong(t, song('spotify'))
    t.spotify.trackEnd()
    await flush()
    expect(names(t.server.calls)).toContain('skip')
  })
})

describe('prefetch and recovery', () => {
  test('prefetches the next song once the current one has played 5s', async () => {
    const next = song('youtube')
    const t = setup(song('youtube', { url: 'https://cur' }), [next])
    t.audio.duration.value = 200
    t.audio.currentTime.value = 2
    await flush()
    expect(t.server.calls).toEqual([])
    t.audio.currentTime.value = 6
    await flush()
    expect(t.server.calls).toEqual([['refreshAudio', { videoId: next.videoId }]])
    expect(t.playback.upNextStatus.value[next.id]).toBe('ready')
  })

  test('prefetches during a Spotify song too', async () => {
    const next = song('soundcloud')
    const t = setup(null, [next])
    await changeSong(t, song('spotify'))
    t.spotify.durationMs.value = 200_000
    t.spotify.position.value = 6_000
    await flush()
    expect(t.server.calls).toContainEqual([
      'refreshAudio',
      { trackUrl: next.trackUrl }
    ])
  })

  test(`stops auto-refreshing an expired stream after ${RETRY_LIMIT} tries`, async () => {
    const current = song('youtube', { url: 'https://expired' })
    const t = setup(current)
    t.server.setRefresh(async () => {
      throw new Error('403')
    })
    // Each failed refresh also skips; keep the song current to retry it.
    for (let i = 0; i < RETRY_LIMIT; i++) {
      t.room.value.currentSong = current
      await t.playback.onAudioExpired()
    }
    t.room.value.currentSong = current
    await t.playback.onAudioExpired()
    expect(t.playback.retryExhausted.value).toBe(true)
    expect(t.error.value).toContain(`after ${RETRY_LIMIT} attempts`)
  })

  test('a manual refresh tries again after the limit and plays', async () => {
    const current = song('youtube', { url: 'https://expired' })
    const t = setup(current)
    t.playback.retryExhausted.value = true
    await t.playback.manualRefreshAudio()
    await flush()
    expect(t.playback.retryExhausted.value).toBe(false)
    expect(names(t.audio.calls)).toContain('play')
  })
})

describe('guests', () => {
  test('a guest never starts players or calls host endpoints', async () => {
    const t = setup(null, [song('youtube')], { isHost: false })
    await changeSong(t, song('youtube', { url: 'https://s' }))
    await t.playback.togglePlay()
    await t.playback.skip()
    expect(t.audio.calls).toEqual([])
    expect(t.server.calls).toEqual([])
  })
})
