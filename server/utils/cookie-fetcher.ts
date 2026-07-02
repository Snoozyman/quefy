import { execSync } from 'node:child_process'

export interface CookieEntry {
  name: string
  domain: string
}

export function parseNetscapeCookies(content: string): CookieEntry[] {
  const entries: CookieEntry[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const fields = trimmed.split('\t')
    if (fields.length < 7) continue
    entries.push({ domain: fields[0]!, name: fields[5]! })
  }
  return entries
}

export async function fetchYouTubeCookies(): Promise<{ cookies: string, count: number }> {
  try {
    const output = execSync(
      'curl -s -c - -L -o /dev/null'
      + ' -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"'
      + ' -H "Accept-Language: en-US,en;q=0.9"'
      + ' -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"'
      + ' https://www.youtube.com',
      { timeout: 30000, encoding: 'utf-8' },
    )

    const lines = output.split('\n').filter(l => l && !l.startsWith('#'))

    if (lines.length === 0) {
      throw new Error('No cookies received from YouTube')
    }

    return { cookies: output, count: lines.length }
  } catch (err: unknown) {
    if (err instanceof Error && 'stderr' in err) {
      throw new Error(`curl failed: ${(err as { stderr: string }).stderr.slice(0, 200)}`)
    }
    throw err
  }
}

export async function fetchSoundCloudCookies(): Promise<{ cookies: string, count: number }> {
  try {
    const output = execSync(
      'curl -s -c - -L -o /dev/null'
      + ' -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"'
      + ' -H "Accept-Language: en-US,en;q=0.9"'
      + ' -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"'
      + ' https://www.soundcloud.com',
      { timeout: 30000, encoding: 'utf-8' },
    )

    const lines = output.split('\n').filter(l => l && !l.startsWith('#'))

    if (lines.length === 0) {
      throw new Error('No cookies received from SoundCloud')
    }

    return { cookies: output, count: lines.length }
  } catch (err: unknown) {
    if (err instanceof Error && 'stderr' in err) {
      throw new Error(`curl failed: ${(err as { stderr: string }).stderr.slice(0, 200)}`)
    }
    throw err
  }
}
