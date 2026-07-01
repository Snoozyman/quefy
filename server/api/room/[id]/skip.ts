import { verifyHost, getRoom, skipSong } from '#server/utils/room'
import { getAudioStreamUrl } from '#server/utils/youtube'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can skip songs'
    })
  }

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  if (room.queue.length === 0) {
    room.currentSong = null
    room.isPlaying = false
    room.position = 0
    emitRoomUpdate(id, room)
    return { currentSong: null, isPlaying: false }
  }

  const next = room.queue.shift()!
  room.currentSong = next
  room.position = 0

  emitRoomUpdate(id, room)

  return { currentSong: next, isPlaying: room.isPlaying }
})
