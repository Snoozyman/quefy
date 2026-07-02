import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

let cachedPath: string | null = null

export function getYtDlpPath(): string {
  if (cachedPath) return cachedPath

  const candidates = [
    join(homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp'
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      cachedPath = candidate
      return cachedPath
    }
  }

  cachedPath = 'yt-dlp'
  return cachedPath
}
