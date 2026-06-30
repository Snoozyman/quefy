import { getRoom } from '#server/utils/room'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  return {
    id: room.id,
    title: room.title,
    currentSong: room.currentSong,
    queue: room.queue.map(s => ({
      id: s.id,
      source: s.source,
      title: s.title,
      addedBy: s.addedBy,
      addedAt: s.addedAt,
      videoId: s.videoId,
      url: s.url,
      trackUri: s.trackUri,
      artists: s.artists,
      albumName: s.albumName,
      albumImageUrl: s.albumImageUrl,
      durationMs: s.durationMs
    })),
    isPlaying: room.isPlaying,
    spotifyConnected: room.spotifyConnected,
    createdAt: room.createdAt
  }
})
