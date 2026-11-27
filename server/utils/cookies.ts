import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'

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


export function mergeAndSaveCookieContent(incoming: string): {
  ok: true
  size: number
} {
  const path = getCookiePath()
  mkdirSync(DATA_DIR, { recursive: true })

  const incomingLines = parseCookieLines(incoming)
  const incomingKeys = new Set(
    incomingLines.map((l) => {
      const f = l.split('\t')
      return f[0]! + '\t' + f[5]!
    })
  )

  let merged: string[]
  if (existsSync(path)) {
    const existing = readFileSync(path, 'utf-8')
    const existingLines = parseCookieLines(existing)
    const kept = existingLines.filter((l) => {
      const f = l.split('\t')
      return !incomingKeys.has(f[0]! + '\t' + f[5]!)
    })
    merged = [...kept, ...incomingLines]
  } else {
    merged = incomingLines
  }

  if (merged.length === 0) {
    if (existsSync(path)) unlinkSync(path)
    return { ok: true, size: 0 }
  }

  const output = `# Netscape HTTP Cookie File\n${merged.join('\n')}\n`
  writeFileSync(path, output, 'utf-8')
  const size = Buffer.byteLength(output, 'utf-8')
  return { ok: true, size }
}

function parseCookieLines(content: string): string[] {
  const normalized = normalizeCurlOutput(content)
  const lines: string[] = []
  for (const line of normalized.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const fields = trimmed.split('\t')
    if (fields.length < 7) continue
    lines.push(trimmed)
  }
  return lines
}

export function getCookieInfo(): { exists: boolean; size: number } {
  const path = getCookiePath()
  if (existsSync(path)) {
    return { exists: true, size: statSync(path).size }
  }
  return { exists: false, size: 0 }
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

/** True if the cookie file already holds at least one cookie for `domain`. */
export function hasCookiesFor(domain: string): boolean {
  const path = getCookiePath()
  if (!existsSync(path)) return false
  return parseCookieLines(readFileSync(path, 'utf-8')).some((line) =>
    line.split('\t')[0]!.includes(domain)
  )
}

/**
 * Merge `incoming` cookies without overriding anything still valid: a cookie
 * is written only if the file lacks it or the stored copy has expired.
 * Protects uploaded (logged-in) cookies from being replaced by anonymous
 * ones. Returns how many cookies were added or replaced.
 */
export function mergeMissingOrExpiredCookies(
  incoming: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): number {
  const path = getCookiePath()
  const existing = existsSync(path)
    ? parseCookieLines(readFileSync(path, 'utf-8'))
    : []

  const keyOf = (line: string) => {
    const f = line.split('\t')
    return f[0]! + '\t' + f[5]!
  }
  const isExpired = (line: string) => {
    const expires = parseInt(line.split('\t')[4]!, 10) || 0
    return expires > 0 && expires <= nowSeconds
  }

  const byKey = new Map(existing.map((l) => [keyOf(l), l]))
  let changed = 0
  for (const line of parseCookieLines(incoming)) {
    const current = byKey.get(keyOf(line))
    if (current && !isExpired(current)) continue
    byKey.set(keyOf(line), line)
    changed++
  }
  if (changed === 0) return 0

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    `# Netscape HTTP Cookie File\n${[...byKey.values()].join('\n')}\n`,
    'utf-8'
  )
  return changed
}
