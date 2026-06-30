import { fetchYouTubeCookies, fetchSoundCloudCookies } from '#server/utils/cookie-fetcher'
import { saveCookieContent } from '#server/utils/cookies'
import { clearAudioCache } from '#server/utils/youtube'
import { clearSoundcloudAudioCache } from '#server/utils/soundcloud'

export default defineEventHandler(async () => {
  try {
    const [ytResult, scResult] = await Promise.allSettled([
      fetchYouTubeCookies(),
      fetchSoundCloudCookies()
    ])

    let cookies = ''
    let totalCount = 0

    if (ytResult.status === 'fulfilled') {
      cookies += ytResult.value.cookies
      totalCount += ytResult.value.count
    }

    if (scResult.status === 'fulfilled') {
      cookies += '\n' + scResult.value.cookies
      totalCount += scResult.value.count
    }

    if (totalCount === 0) {
      throw createError({ statusCode: 502, statusMessage: 'No cookies received' })
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
