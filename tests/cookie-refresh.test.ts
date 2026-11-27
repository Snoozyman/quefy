import { expect, test, describe, beforeEach, mock } from 'bun:test'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isCookieRefreshable } from '../server/utils/yt-dlp-errors'
import { mergeMissingOrExpiredCookies } from '../server/utils/cookies'

const NOW = 1_800_000_000
const line = (domain: string, name: string, expires: number, value: string) =>
  [domain, 'TRUE', '/', 'TRUE', String(expires), name, value].join('\t')

let cookieFile: string
beforeEach(() => {
  cookieFile = join(mkdtempSync(join(tmpdir(), 'quefy-')), 'cookies.txt')
  process.env.YT_DLP_COOKIES = cookieFile
})

describe('isCookieRefreshable', () => {
  test('bot checks, 403s and sign-in prompts are refreshable', () => {
    expect(
      isCookieRefreshable("Sign in to confirm you're not a bot. Use --cookies")
    ).toBe(true)
    expect(isCookieRefreshable('ERROR: HTTP Error 403: Forbidden')).toBe(true)
  })

  test('account-gated content is not', () => {
    expect(isCookieRefreshable('Sign in to confirm your age')).toBe(false)
    expect(isCookieRefreshable('This video is only available to members')).toBe(
      false
    )
    expect(isCookieRefreshable('Private video. Sign in')).toBe(false)
    expect(isCookieRefreshable('Video unavailable')).toBe(false)
  })
})

describe('mergeMissingOrExpiredCookies', () => {
  test('keeps valid uploaded cookies, replaces expired, adds missing', () => {
    writeFileSync(
      cookieFile,
      [
        line('.youtube.com', 'SID', NOW + 1000, 'logged-in'),
        line('.youtube.com', 'YSC', NOW - 10, 'stale')
      ].join('\n')
    )
    const changed = mergeMissingOrExpiredCookies(
      [
        line('.youtube.com', 'SID', NOW + 9999, 'anon'),
        line('.youtube.com', 'YSC', NOW + 9999, 'fresh'),
        line('.youtube.com', 'VISITOR_INFO1_LIVE', NOW + 9999, 'new')
      ].join('\n'),
      NOW
    )
    const file = readFileSync(cookieFile, 'utf-8')
    expect(changed).toBe(2)
    expect(file).toContain('logged-in')
    expect(file).not.toContain('anon')
    expect(file).toContain('fresh')
    expect(file).not.toContain('stale')
    expect(file).toContain('VISITOR_INFO1_LIVE')
  })

  test('session cookies (expires 0) count as valid', () => {
    writeFileSync(cookieFile, line('.youtube.com', 'S', 0, 'session'))
    expect(
      mergeMissingOrExpiredCookies(line('.youtube.com', 'S', NOW + 1, 'x'), NOW)
    ).toBe(0)
  })
})

describe('autoRefreshCookies', () => {
  test('shares one fetch between callers and respects the cooldown', async () => {
    let fetches = 0
    mock.module('../server/utils/cookie-fetcher', () => ({
      fetchYouTubeCookies: async () => {
        fetches++
        return {
          cookies: line('.youtube.com', `C${fetches}`, NOW * 2, 'v'),
          count: 1
        }
      },
      fetchSoundCloudCookies: async () => {
        throw new Error('offline')
      }
    }))
    const { autoRefreshCookies, resetAutoRefreshCooldown } = await import(
      '../server/utils/cookie-refresh'
    )
    resetAutoRefreshCooldown()

    const [a, b] = await Promise.all([autoRefreshCookies(), autoRefreshCookies()])
    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(fetches).toBe(1)

    expect(await autoRefreshCookies()).toBe(false) // within cooldown
    expect(fetches).toBe(1)
  })
})
