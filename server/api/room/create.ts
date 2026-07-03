import { createRoom } from '#server/utils/room'
import {
  fetchYouTubeCookies,
  fetchSoundCloudCookies
} from '#server/utils/cookie-fetcher'
import { mergeAndSaveCookieContent } from '#server/utils/cookies'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const title = body?.title as string | undefined
  const room = createRoom(title)

  Promise.allSettled([fetchYouTubeCookies(), fetchSoundCloudCookies()])
    .then(([yt, sc]) => {
      if (yt.status === 'fulfilled') mergeAndSaveCookieContent(yt.value.cookies)
      if (sc.status === 'fulfilled') mergeAndSaveCookieContent(sc.value.cookies)
    })
    .catch(() => {})

  return { roomId: room.id, hostToken: room.hostToken, title: room.title }
})
