import { createRoom } from '#server/utils/room'
import {
  fetchYouTubeCookies,
  fetchSoundCloudCookies
} from '#server/utils/cookie-fetcher'
import {
  hasCookiesFor,
  mergeAndSaveCookieContent
} from '#server/utils/cookies'

/**
 * Seed anonymous cookies for a site only when none exist yet, so creating a
 * room never overwrites cookies the user uploaded or refreshed on purpose.
 */
function seedMissingCookies(): void {
  const fetches: Promise<{ cookies: string }>[] = []
  if (!hasCookiesFor('youtube.com')) fetches.push(fetchYouTubeCookies())
  if (!hasCookiesFor('soundcloud.com')) fetches.push(fetchSoundCloudCookies())
  if (fetches.length === 0) return

  Promise.allSettled(fetches)
    .then((results) => {
      for (const r of results) {
        if (r.status === 'fulfilled') mergeAndSaveCookieContent(r.value.cookies)
        else console.warn('[cookies] auto-seed failed:', r.reason)
      }
    })
    .catch(() => {})
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const title = body?.title as string | undefined
  const room = createRoom(title)

  seedMissingCookies()

  return { roomId: room.id, hostToken: room.hostToken, title: room.title }
})
