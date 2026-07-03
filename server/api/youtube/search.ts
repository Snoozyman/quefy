import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseYtDlpError } from '#server/utils/yt-dlp-errors'
import { getCookiesArgs } from '#server/utils/cookies'
import { getYtDlpPath, getYtDlpBaseArgs } from '#server/utils/yt-dlp'

const execFileAsync = promisify(execFile)

interface SearchResult {
  id: string
  title: string
  channel: string
  duration: number
  durationString: string
  thumbnail: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.trim()
  if (!q || q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Query too short' })
  }

  const maxResults = Math.min(Math.max(Number(query.limit) || 10, 1), 50)

  let stdout: string
  try {
    const result = await execFileAsync(getYtDlpPath(), [
      `ytsearch${maxResults}:${q}`,
      '--flat-playlist',
      '--print-json',
      '--no-warnings',
      ...getYtDlpBaseArgs(),
      ...getCookiesArgs()
    ])
    stdout = result.stdout
  } catch (err: any) {
    const stderr = err.stderr || ''
    console.error('[yt-dlp]', stderr)
    throw createError({
      statusCode: 500,
      statusMessage: parseYtDlpError(stderr)
    })
  }

  const results: SearchResult[] = stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const item = JSON.parse(line)
      return {
        id: item.id,
        title: item.title,
        channel: item.channel || item.uploader || '',
        duration: item.duration ?? 0,
        durationString: item.duration_string || '',
        thumbnail: item.thumbnails?.[0]?.url || ''
      }
    })

  return results
})
