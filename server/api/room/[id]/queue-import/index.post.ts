import { getRoom, verifyHost, bulkAddToQueue } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'
import type { SongData } from '#shared/types/room'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  const body = await readBody<{
    hostToken: string
    songs: SongData[]
  }>(event)

  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can import'
    })

  if (!Array.isArray(body.songs) || body.songs.length === 0)
    throw createError({ statusCode: 400, statusMessage: 'No songs provided' })

  const songs = body.songs
    .filter((s) => s.source && s.title)
    .map((s) => ({
      source: s.source,
      title: s.title,
      addedBy: 'Host',
      videoId: s.videoId,
      url: undefined as string | undefined,
      trackUri: s.source === 'spotify' ? s.trackUri : undefined,
      trackUrl: s.source === 'soundcloud' ? s.trackUrl : undefined,
      artists: s.artists,
      albumName: s.albumName,
      albumImageUrl: s.albumImageUrl,
      durationMs: s.durationMs
    }))

  if (songs.length === 0)
    throw createError({ statusCode: 422, statusMessage: 'No valid songs found' })

  const added = bulkAddToQueue(id, songs)
  emitRoomUpdate(id, room)

  return { count: added.length }
})
