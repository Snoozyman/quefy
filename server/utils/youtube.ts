import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseYtDlpError } from './yt-dlp-errors'
import { getCookiesArgs } from './cookies'
import { getYtDlpPath } from './yt-dlp'

const execFileAsync = promisify(execFile)

interface AudioStream {
  url: string
  mimeType: string
  contentLength: string
  audioQuality: string
  itag: number
  title: string
  duration: number
}

const cache = new Map<string, { data: AudioStream; ts: number }>()
const CACHE_TTL = 3_600_000

export function clearAudioCache(): void {
  cache.clear()
}

export async function getAudioStreamUrl(videoId: string): Promise<AudioStream> {
  const cached = cache.get(videoId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  let stdout: string
  let stderr: string
  try {
    const result = await execFileAsync(getYtDlpPath(), [
      '-f',
      'bestaudio',
      '--print-json',
      '--print',
      'url',
      ...getCookiesArgs(),
      `https://www.youtube.com/watch?v=${videoId}`
    ])
    stdout = result.stdout
    stderr = result.stderr
  } catch (err: unknown) {
    stderr = (err as any)?.stderr || ''
    console.error('[yt-dlp]', stderr)
    throw new Error(parseYtDlpError(stderr), { cause: err })
  }

  const lines = stdout.trim().split('\n')
  const url = lines[0]!
  const meta = JSON.parse(lines[1]!)

  if (!url) throw new Error('No audio URL returned from yt-dlp')

  const duration = Number(meta.duration) || 0
  if (!duration)
    throw new Error('Video has no duration (live stream or unavailable)')

  const data: AudioStream = {
    url,
    mimeType: meta.ext ? `audio/${meta.ext}` : 'audio/webm',
    contentLength: String(meta.filesize ?? meta.filesize_approx ?? 0),
    audioQuality: meta.quality ?? '',
    itag: meta.format_id ?? 0,
    title: meta.title ?? '',
    duration
  }

  cache.set(videoId, { data, ts: Date.now() })
  return data
}
