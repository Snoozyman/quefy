import { fetchYouTubeCookies, fetchSoundCloudCookies, parseNetscapeCookies } from '#server/utils/cookie-fetcher'
import type { CookieEntry } from '#server/utils/cookie-fetcher'
import { saveCookieContent, isValidNetscapeFormat } from '#server/utils/cookies'
import { clearAudioCache } from '#server/utils/youtube'
import { clearSoundcloudAudioCache } from '#server/utils/soundcloud'

export default defineEventHandler(async () => {
  try {
    const [ytResult, scResult] = await Promise.allSettled([
      fetchYouTubeCookies(),
      fetchSoundCloudCookies()
    ])

    const parts: string[] = []
    let totalCount = 0
    let youtube: CookieEntry[] | null = null
    let soundcloud: CookieEntry[] | null = null

    if (ytResult.status === 'fulfilled') {
      parts.push(ytResult.value.cookies)
      totalCount += ytResult.value.count
      youtube = parseNetscapeCookies(ytResult.value.cookies)
    }

    if (scResult.status === 'fulfilled') {
      parts.push(scResult.value.cookies)
      totalCount += scResult.value.count
      soundcloud = parseNetscapeCookies(scResult.value.cookies)
    }

    if (totalCount === 0) {
      throw createError({ statusCode: 502, statusMessage: 'No cookies received' })
    }

    const cookies = parts.join('\n')
    if (!isValidNetscapeFormat(cookies)) {
      throw createError({ statusCode: 502, statusMessage: 'Auto-fetched cookies are not in valid Netscape format. Try manually uploading a cookies.txt file.' })
    }

    saveCookieContent(cookies)
    clearAudioCache()
    clearSoundcloudAudioCache()

    return { ok: true, count: totalCount, youtube, soundcloud }
  } catch (err: unknown) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch cookies: ${err instanceof Error ? err.message : 'Unknown error'}`
    })
  }
})
