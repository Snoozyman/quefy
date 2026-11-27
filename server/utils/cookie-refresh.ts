import {
  fetchYouTubeCookies,
  fetchSoundCloudCookies
} from './cookie-fetcher'
import { mergeMissingOrExpiredCookies } from './cookies'

/** Minimum time between automatic refreshes, so failures can't hammer sites. */
export const AUTO_REFRESH_COOLDOWN_MS = 5 * 60_000

let inFlight: Promise<boolean> | null = null
let lastAttemptAt = 0

/**
 * Fetch fresh anonymous YouTube / SoundCloud cookies and merge in the ones
 * that are missing or expired. Concurrent callers share one fetch, and
 * attempts are rate-limited. Resolves true if any cookie changed (so a
 * retry has a chance of succeeding).
 */
export function autoRefreshCookies(): Promise<boolean> {
  if (inFlight) return inFlight
  if (Date.now() - lastAttemptAt < AUTO_REFRESH_COOLDOWN_MS) {
    return Promise.resolve(false)
  }
  lastAttemptAt = Date.now()

  inFlight = (async () => {
    const results = await Promise.allSettled([
      fetchYouTubeCookies(),
      fetchSoundCloudCookies()
    ])
    let changed = 0
    for (const r of results) {
      if (r.status === 'fulfilled') {
        changed += mergeMissingOrExpiredCookies(r.value.cookies)
      } else {
        console.warn('[cookies] auto-refresh fetch failed:', r.reason)
      }
    }
    console.info(`[cookies] auto-refresh updated ${changed} cookie(s)`)
    return changed > 0
  })()
    .catch((err: unknown) => {
      console.warn('[cookies] auto-refresh failed:', err)
      return false
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** Test hook: forget the cooldown. */
export function resetAutoRefreshCooldown(): void {
  lastAttemptAt = 0
}
