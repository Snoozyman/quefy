import { ref } from 'vue'
import type { SongData } from '#shared/types/room'
import { audioSource, isAudioSong, type AudioSource } from './types'

export type PrefetchStatus = 'loading' | 'ready'

export interface PrefetcherDeps {
  /** The song after the current one. */
  next: () => SongData | undefined
  /** Only the host (with its token) prefetches. */
  enabled: () => boolean
  refresh: (source: AudioSource) => Promise<{ url: string }>
}

/**
 * Resolves the next queued song's stream URL while the current one plays,
 * so a track change needs no network round trip (and no ~5s YouTube
 * activation wait). That keeps playback going on a locked phone.
 *
 * Stream URLs resolved in this browser are kept here by song id: live room
 * updates replace song objects and drop client-side `url`s.
 */
export function createPrefetcher(deps: PrefetcherDeps) {
  const urls = new Map<string, string>()
  /** At most one attempt per song, success or failure. */
  const attempted = new Set<string>()
  /** Running requests, so a skip can wait for one instead of racing it. */
  const inFlight = new Map<string, Promise<string | undefined>>()
  /** Shown on the "Up next" row. */
  const status = ref<Record<string, PrefetchStatus>>({})

  function setStatus(id: string, value: PrefetchStatus | null) {
    const { [id]: _, ...rest } = status.value
    status.value = value ? { ...rest, [id]: value } : rest
  }

  /** Remember a URL resolved in this browser (prefetch or refresh). */
  function remember(songId: string, url: string) {
    urls.set(songId, url)
  }

  /** A playable URL for `song` if one is already known, without a request. */
  function knownUrl(song: SongData): string | undefined {
    return song.url ?? urls.get(song.id)
  }

  async function prefetchNext() {
    const next = deps.next()
    if (!deps.enabled()) return
    if (!isAudioSong(next) || knownUrl(next) || attempted.has(next.id)) return
    const source = audioSource(next)
    if (!source) return

    attempted.add(next.id)
    setStatus(next.id, 'loading')
    const request = deps
      .refresh(source)
      .then((res) => {
        urls.set(next.id, res.url)
        setStatus(next.id, 'ready')
        return res.url
      })
      // Not fatal: the song is resolved normally when it starts.
      .catch(() => {
        setStatus(next.id, null)
        return undefined
      })
      .finally(() => inFlight.delete(next.id))
    inFlight.set(next.id, request)
    await request
  }

  /** The URL for `song`, waiting for a prefetch that is still running. */
  async function resolvePending(song: SongData): Promise<string | undefined> {
    return urls.get(song.id) ?? (await inFlight.get(song.id))
  }

  /** Forget everything about songs no longer queued or playing. */
  function retain(queuedIds: string[], currentId: string | undefined) {
    const keep = new Set([...queuedIds, currentId])
    for (const id of urls.keys()) if (!keep.has(id)) urls.delete(id)
    for (const id of attempted) if (!keep.has(id)) attempted.delete(id)
    status.value = Object.fromEntries(
      Object.entries(status.value).filter(([id]) => queuedIds.includes(id))
    )
  }

  return { status, remember, knownUrl, prefetchNext, resolvePending, retain }
}

export type Prefetcher = ReturnType<typeof createPrefetcher>
