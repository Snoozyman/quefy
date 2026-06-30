import type { SearchResult } from '#shared/types/room'
import { getSoundcloudCookieHeader } from '#server/utils/cookies'

const SC_CLIENT_ID = 'a3e059563d7fd3372b49b37f00a00bcf'

interface SoundcloudSearchResponse {
  collection: Array<{
    id: number
    title: string
    duration: number
    permalink_url: string
    artwork_url: string | null
    user: { username: string } | null
  }>
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()
  const maxResults = Math.min(Number(query.limit) || 8, 50)

  if (q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Query too short' })
  }

  try {
    const cookieHeader = getSoundcloudCookieHeader()
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Origin': 'https://soundcloud.com',
      'Referer': 'https://soundcloud.com/'
    }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const data = await $fetch<SoundcloudSearchResponse>(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&limit=${maxResults}&client_id=${SC_CLIENT_ID}`,
      { headers }
    )

    const results: SearchResult[] = data.collection.map((item) => ({
      id: item.permalink_url || `${item.id}`,
      title: item.title || 'Unknown Track',
      channel: item.user?.username || 'Unknown Artist',
      duration: Math.round((item.duration ?? 0) / 1000),
      durationString: formatDuration(item.duration),
      thumbnail: item.artwork_url?.replace('large', 't500x500') || '',
      source: 'soundcloud' as const,
      artists: item.user?.username ? [item.user.username] : undefined,
      durationMs: item.duration ?? 0
    }))

    return results
  } catch (err: any) {
    const detail = err.statusMessage || err.data?.message || err.data?.error || err.message
    console.error('[soundcloud search]', detail)
    throw createError({
      statusCode: 502,
      statusMessage: 'SoundCloud search failed'
    })
  }
})

function formatDuration(ms?: number): string {
  if (!ms) return ''
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
