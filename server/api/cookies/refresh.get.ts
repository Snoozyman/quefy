import { fetchYouTubeCookies, fetchSoundCloudCookies } from '#server/utils/cookie-fetcher'
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

    if (ytResult.status === 'fulfilled') {
      parts.push(ytResult.value.cookies)
      totalCount += ytResult.value.count
    }

    if (scResult.status === 'fulfilled') {
      parts.push(scResult.value.cookies)
      totalCount += scResult.value.count
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

    return { ok: true, count: totalCount }
  } catch (err: unknown) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch cookies: ${err instanceof Error ? err.message : 'Unknown error'}`
    })
  }
})
