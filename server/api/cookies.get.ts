import { getCookieInfo, getCookiePath } from '#server/utils/cookies'
import { readFileSync } from 'node:fs'
import { parseNetscapeCookies } from '#server/utils/cookie-fetcher'
import type { CookieEntry } from '#server/utils/cookie-fetcher'

export default defineEventHandler(() => {
  const info = getCookieInfo()
  if (!info.exists) {
    return { exists: false, size: 0 }
  }

  const content = readFileSync(getCookiePath(), 'utf-8')
  const yt: CookieEntry[] = []
  const sc: CookieEntry[] = []

  for (const entry of parseNetscapeCookies(content)) {
    if (entry.domain.includes('youtube.com')) {
      yt.push(entry)
    } else if (entry.domain.includes('soundcloud.com')) {
      sc.push(entry)
    }
  }

  return { exists: true, size: info.size, youtube: yt, soundcloud: sc }
})
