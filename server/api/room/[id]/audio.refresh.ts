import { verifyHost } from '#server/utils/room'
import { getSoundcloudAudioStreamUrl, clearSoundcloudAudioCacheFor } from '#server/utils/soundcloud'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string, trackUrl: string }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({ statusCode: 403, statusMessage: 'Only the host can refresh audio' })

  if (!body.trackUrl)
    throw createError({ statusCode: 400, statusMessage: 'Missing trackUrl' })

  try {
    clearSoundcloudAudioCacheFor(body.trackUrl)
    const audio = await getSoundcloudAudioStreamUrl(body.trackUrl)
    return { url: audio.url, title: audio.title }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: err.message || 'Failed to refresh audio stream'
    })
  }
})
