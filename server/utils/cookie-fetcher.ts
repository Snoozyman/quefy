import { execSync } from 'node:child_process'
import { normalizeCurlOutput } from './cookies'

export interface CookieEntry {
  name: string
  domain: string
  expires: number
}

export function parseNetscapeCookies(content: string): CookieEntry[] {
  const entries: CookieEntry[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const fields = trimmed.split('\t')
    if (fields.length < 7) continue
    entries.push({
      domain: fields[0]!,
      expires: parseInt(fields[4]!, 10) || 0,
      name: fields[5]!
    })
  }
  return entries
}

function randomChromeVersion(): number {
  const MAJOR_RANGE = [143, 149]
  return (
    MAJOR_RANGE[0]! +
    Math.floor(Math.random() * (MAJOR_RANGE[1]! - MAJOR_RANGE[0]! + 1))
  )
}

function buildCurlHeaders(): string {
  const version = randomChromeVersion()
  return (
    ` -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36"` +
    ' -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"' +
    ' -H "Accept-Language: en-us,en;q=0.5"' +
    ' -H "Sec-Fetch-Mode: navigate"'
  )
}

function fetchCookies(url: string): { cookies: string; count: number } {
  const raw = execSync(
    `curl -s -c - -L -o /dev/null${buildCurlHeaders()} ${url}`,
    { timeout: 30000, encoding: 'utf-8' }
  )

  const output = normalizeCurlOutput(raw)
  const lines = output.split('\n').filter((l) => l && !l.startsWith('#'))

  if (lines.length === 0) {
    throw new Error(`No cookies received from ${url}`)
  }

  return { cookies: output, count: lines.length }
}

export async function fetchYouTubeCookies(): Promise<{
  cookies: string
  count: number
}> {
  try {
    return fetchCookies('https://www.youtube.com')
  } catch (err: unknown) {
    if (err instanceof Error && 'stderr' in err) {
      throw new Error(
        `curl failed: ${(err as { stderr: string }).stderr.slice(0, 200)}`,
        { cause: err }
      )
    }
    throw err
  }
}

export async function fetchSoundCloudCookies(): Promise<{
  cookies: string
  count: number
}> {
  try {
    return fetchCookies('https://www.soundcloud.com')
  } catch (err: unknown) {
    if (err instanceof Error && 'stderr' in err) {
      throw new Error(
        `curl failed: ${(err as { stderr: string }).stderr.slice(0, 200)}`,
        { cause: err }
      )
    }
    throw err
  }
}
