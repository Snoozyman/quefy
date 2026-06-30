import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { SearchResult } from '#shared/types/room'

const execFileAsync = promisify(execFile)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()
  const maxResults = Math.min(Number(query.limit) || 8, 50)

  if (q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Query too short' })
  }

  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '--flat-playlist',
      '--print-json',
      '--no-warnings',
      `scsearch${maxResults}:${q}`
    ])

    const lines = stdout.trim().split('\n').filter(Boolean)
    const results: SearchResult[] = lines.map((line) => {
      const item = JSON.parse(line)
      return {
        id: item.url || item.id,
        title: item.title || 'Unknown Track',
        channel: item.uploader || item.channel || 'Unknown Artist',
        duration: item.duration ?? 0,
        durationString: formatDuration(item.duration),
        thumbnail: item.thumbnail || '',
        source: 'soundcloud' as const,
        artists: item.uploader ? [item.uploader] : undefined,
        albumName: item.album ?? item.playlist_title,
        durationMs: item.duration ? item.duration * 1000 : undefined
      }
    })

    return results
  } catch (err: any) {
    console.error('[soundcloud search]', err.stderr || err.message)
    throw createError({
      statusCode: 502,
      statusMessage: 'SoundCloud search failed'
    })
  }
})

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
