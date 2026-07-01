import { getRoom, verifyHost } from '#server/utils/room'
import { registerHostStream, registerRoomClient, unregisterRoomClient, isHostDisconnect, emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })
  }

  const room = getRoom(id)
  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })
  }

  const hostToken = getQuery(event).hostToken as string | undefined
  const isHost = hostToken && verifyHost(id, hostToken)

  const stream = createEventStream(event)
  if (isHost) {
    registerHostStream(id, stream)
  } else {
    registerRoomClient(id, stream)
  }

  stream.push({
    event: 'room-update',
    data: JSON.stringify({
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
    })
  })

  stream.onClosed(() => {
    if (isHostDisconnect(id, stream)) {
      room.isPlaying = false
      room.currentSong = null
      emitRoomUpdate(id, room)
    }
    unregisterRoomClient(id, stream)
  })

  return stream.send()
})
