import { describe, expect, test } from 'bun:test'
import { createPrefetcher } from '../../app/playback/prefetch'
import { song } from './fakes'

function setup(next: ReturnType<typeof song> | undefined, enabled = true) {
  const requests: unknown[] = []
  let respond: (source: unknown) => Promise<{ url: string }> = async () => ({
    url: 'https://stream/next'
  })
  const p = createPrefetcher({
    next: () => next,
    enabled: () => enabled,
    refresh: (source) => {
      requests.push(source)
      return respond(source)
    }
  })
  return {
    p,
    requests,
    setRespond: (fn: typeof respond) => {
      respond = fn
    }
  }
}

describe('createPrefetcher', () => {
  test('resolves the next audio song once and marks it ready', async () => {
    const next = song('youtube')
    const { p, requests } = setup(next)

    const run = p.prefetchNext()
    expect(p.status.value[next.id]).toBe('loading')
    await run
    expect(p.status.value[next.id]).toBe('ready')
    expect(p.knownUrl(next)).toBe('https://stream/next')

    await p.prefetchNext()
    expect(requests).toEqual([{ videoId: next.videoId }])
  })

  test('uses the SoundCloud track URL as the source', async () => {
    const next = song('soundcloud')
    const { p, requests } = setup(next)
    await p.prefetchNext()
    expect(requests).toEqual([{ trackUrl: next.trackUrl }])
  })

  test('does nothing for Spotify songs, known URLs, or guests', async () => {
    for (const [next, enabled] of [
      [song('spotify'), true],
      [song('youtube', { url: 'https://already' }), true],
      [song('youtube'), false]
    ] as const) {
      const { p, requests } = setup(next, enabled)
      await p.prefetchNext()
      expect(requests).toEqual([])
    }
  })

  test('a failed prefetch clears its status and is not retried', async () => {
    const next = song('youtube')
    const { p, requests, setRespond } = setup(next)
    setRespond(async () => {
      throw new Error('403')
    })
    await p.prefetchNext()
    expect(p.status.value[next.id]).toBeUndefined()
    expect(p.knownUrl(next)).toBeUndefined()
    await p.prefetchNext()
    expect(requests).toHaveLength(1)
  })

  test('resolvePending waits for a prefetch that is still running', async () => {
    const next = song('youtube')
    const { p, setRespond } = setup(next)
    let release!: () => void
    setRespond(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ url: 'https://late' })
        })
    )
    void p.prefetchNext()
    const pending = p.resolvePending(next)
    release()
    expect(await pending).toBe('https://late')
  })

  test('retain forgets songs that left the queue', async () => {
    const next = song('youtube')
    const { p } = setup(next)
    await p.prefetchNext()
    p.retain([], undefined)
    expect(p.knownUrl(next)).toBeUndefined()
    expect(p.status.value).toEqual({})
  })

  test('remember makes a refreshed URL known', () => {
    const s = song('youtube')
    const { p } = setup(undefined)
    p.remember(s.id, 'https://refreshed')
    expect(p.knownUrl(s)).toBe('https://refreshed')
  })
})
