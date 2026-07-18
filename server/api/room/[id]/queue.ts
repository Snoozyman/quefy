import { getRoom, addToQueue } from '#server/utils/room'
import { getAudioStreamUrl } from '#server/utils/youtube'
import { getSoundcloudAudioStreamUrl } from '#server/utils/soundcloud'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  const body = await readBody<{
    source?: string
    videoId?: string
    trackUri?: string
    trackUrl?: string
    title?: string
    artists?: string[]
    albumName?: string
    albumImageUrl?: string
    durationMs?: number
    addedBy?: string
  }>(event)

  if (!body)
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })

  const source = body.source ?? 'youtube'

  if (source === 'spotify') {
    if (!body.trackUri || !body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing trackUri or title for Spotify song'
      })
    }

    const song = addToQueue(id, {
      source: 'spotify',
      title: body.title,
      addedBy: body.addedBy ?? 'Anonymous',
      trackUri: body.trackUri,
      artists: body.artists,
      albumName: body.albumName,
      albumImageUrl: body.albumImageUrl,
      durationMs: body.durationMs
    })

    if (!song)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add song'
      })

    emitRoomUpdate(id, room)

    return song
  }

  if (source === 'soundcloud') {
    if (!body.trackUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing trackUrl for SoundCloud song'
      })
    }

    let audio
    try {
      audio = await getSoundcloudAudioStreamUrl(body.trackUrl)
    } catch (err: any) {
      throw createError({
        statusCode: 422,
        statusMessage: err.message || 'Failed to fetch SoundCloud track'
      })
    }

    const song = addToQueue(id, {
      source: 'soundcloud',
      title: body.title || audio.title,
      addedBy: body.addedBy ?? 'Anonymous',
      url: audio.url,
      trackUrl: body.trackUrl,
      albumImageUrl: body.albumImageUrl || audio.thumbnail || '',
      durationMs: Math.round(audio.duration * 1000)
    })

    if (!song)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add song'
      })

    emitRoomUpdate(id, room)

    return song
  }

  // YouTube source (default)
  if (!body.videoId)
    throw createError({ statusCode: 400, statusMessage: 'Missing videoId' })

  if (body.title && body.durationMs) {
    const song = addToQueue(id, {
      source: 'youtube',
      title: body.title,
      addedBy: body.addedBy ?? 'Anonymous',
      videoId: body.videoId,
      albumImageUrl:
        body.albumImageUrl ||
        `https://img.youtube.com/vi/${body.videoId}/hqdefault.jpg`,
      durationMs: body.durationMs
    })

    if (!song)
      throw createError({ statusCode: 500, statusMessage: 'Failed to add song' })

    emitRoomUpdate(id, room)
    return song
  }

  let audio
  try {
    audio = await getAudioStreamUrl(body.videoId)
  } catch (err: any) {
    throw createError({
      statusCode: 422,
      statusMessage: err.message || 'Failed to fetch video'
    })
  }

  const song = addToQueue(id, {
    source: 'youtube',
    title: audio.title,
    addedBy: body.addedBy ?? 'Anonymous',
    videoId: body.videoId,
    url: audio.url,
    albumImageUrl: `https://img.youtube.com/vi/${body.videoId}/hqdefault.jpg`,
    durationMs: Math.round(audio.duration * 1000)
  })

  if (!song)
    throw createError({ statusCode: 500, statusMessage: 'Failed to add song' })

  emitRoomUpdate(id, room)

  return song
})
