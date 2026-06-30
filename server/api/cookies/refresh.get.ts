import { fetchYouTubeCookies } from '#server/utils/cookie-fetcher'
import { saveCookieContent } from '#server/utils/cookies'
import { clearAudioCache } from '#server/utils/youtube'

export default defineEventHandler(async () => {
  try {
    const result = await fetchYouTubeCookies()
    if (result.count === 0) {
      throw createError({ statusCode: 502, statusMessage: 'No cookies received from YouTube' })
    }

    saveCookieContent(result.cookies)
    clearAudioCache()

    return { ok: true, count: result.count }
  } catch (err: unknown) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch YouTube cookies: ${err instanceof Error ? err.message : 'Unknown error'}`
    })
  }
})
