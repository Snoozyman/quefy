import { verifyHost } from '#server/utils/room'
import {
  getSoundcloudAudioStreamUrl,
  clearSoundcloudAudioCacheFor
} from '#server/utils/soundcloud'
import { getAudioStreamUrl, clearAudioCache } from '#server/utils/youtube'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{
    hostToken: string
    trackUrl?: string
    videoId?: string
  }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can refresh audio'
    })

  if (!body.trackUrl && !body.videoId)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing trackUrl or videoId'
    })

  let url: string
  let title: string
  let durationMs: number

  try {
    if (body.videoId) {
      clearAudioCache()
      const audio = await getAudioStreamUrl(body.videoId)
      url = audio.url
      title = audio.title
      durationMs = Math.round(audio.duration * 1000)
    } else {
      clearSoundcloudAudioCacheFor(body.trackUrl!)
      const audio = await getSoundcloudAudioStreamUrl(body.trackUrl!)
      url = audio.url
      title = audio.title
      durationMs = Math.round(audio.duration * 1000)
    }
    return { url, title, durationMs }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: err.message || 'Failed to refresh audio stream'
    })
  }
})
