import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { parseYtDlpError } from './yt-dlp-errors'
import { getCookiePath } from './cookies'

const execFileAsync = promisify(execFile)

interface AudioStream {
  url: string
  mimeType: string
  contentLength: string
  title: string
  duration: number
  thumbnail: string
}

const cache = new Map<string, { data: AudioStream, ts: number }>()
const CACHE_TTL = 3_600_000

function getCookiesArgs(): string[] {
  const cookiesPath = getCookiePath()
  if (existsSync(cookiesPath)) {
    return ['--cookies', cookiesPath]
  }
  return []
}

export function clearSoundcloudAudioCache(): void {
  cache.clear()
}

export async function getSoundcloudAudioStreamUrl(trackUrl: string): Promise<AudioStream> {
  const cached = cache.get(trackUrl)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  let stdout: string
  let stderr: string
  try {
    const result = await execFileAsync('yt-dlp', [
      '-f',
      'bestaudio/best',
      '--print-json',
      '--print',
      'url',
      ...getCookiesArgs(),
      trackUrl
    ])
    stdout = result.stdout
    stderr = result.stderr
  } catch (err: unknown) {
    stderr = (err as any)?.stderr || ''
    console.error('[yt-dlp soundcloud]', stderr)
    throw new Error(parseYtDlpError(stderr), { cause: err })
  }

  const lines = stdout.trim().split('\n')
  const url = lines[0]!
  const meta = JSON.parse(lines[1]!)

  if (!url) throw new Error('No audio URL returned from yt-dlp')

  const duration = Number(meta.duration) || 0
  if (!duration) throw new Error('Track has no duration (unavailable)')

  const data: AudioStream = {
    url,
    mimeType: meta.ext ? `audio/${meta.ext}` : 'audio/webm',
    contentLength: String(meta.filesize ?? meta.filesize_approx ?? 0),
    title: meta.title ?? '',
    duration,
    thumbnail: meta.thumbnail || ''
  }

  cache.set(trackUrl, { data, ts: Date.now() })
  return data
}
