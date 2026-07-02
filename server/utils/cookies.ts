import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'data')

export function getCookiePath(): string {
  return process.env.YT_DLP_COOKIES ?? join(DATA_DIR, 'cookies.txt')
}

export function normalizeCurlOutput(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      if (line.startsWith('#HttpOnly_')) {
        return line.slice('#HttpOnly_'.length)
      }
      return line
    })
    .join('\n')
}

export function isValidNetscapeFormat(content: string): boolean {
  let hasCookie = false
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.split('\t').length < 7) return false
    hasCookie = true
  }
  return hasCookie
}

export function getCookiesArgs(): string[] {
  const cookiesPath = getCookiePath()
  if (!existsSync(cookiesPath)) return []

  try {
    const content = readFileSync(cookiesPath, 'utf-8')
    if (!isValidNetscapeFormat(content)) {
      unlinkSync(cookiesPath)
      console.warn('[cookies] deleted invalid cookies file at', cookiesPath)
      return []
    }
    return ['--cookies', cookiesPath]
  } catch {
    try {
      unlinkSync(cookiesPath)
    } catch {
      // file already gone or permissions — ignore
    }
    return []
  }
}

export function saveCookieContent(content: string): { ok: true, size: number } {
  const path = getCookiePath()
  const normalized = normalizeCurlOutput(content.trim())
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(path, normalized, 'utf-8')
  const size = Buffer.byteLength(normalized, 'utf-8')
  return { ok: true, size }
}

export function getCookieInfo(): { exists: boolean, size: number } {
  const path = getCookiePath()
  if (existsSync(path)) {
    return { exists: true, size: statSync(path).size }
  }
  return { exists: false, size: 0 }
}

export function getCookiePreview(): string {
  const path = getCookiePath()
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf-8').slice(0, 500)
}

export function deleteCookieFile(): void {
  const path = getCookiePath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function getSoundcloudCookieHeader(): string {
  const path = getCookiePath()
  if (!existsSync(path)) return ''

  const content = readFileSync(path, 'utf-8')
  const cookies: string[] = []

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const fields = trimmed.split('\t')
    if (fields.length < 7) continue
    const domain = fields[0]!
    if (domain.includes('soundcloud.com')) {
      cookies.push(`${fields[5]}=${fields[6]}`)
    }
  }

  return cookies.join('; ')
}
