import { verifyHost, getRoom, skipSong } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  if (!verifyHost(id, body.hostToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can skip songs'
    })
  }

  const next = skipSong(id, body.hostToken)
  emitRoomUpdate(id, room)

  return { currentSong: next, isPlaying: room.isPlaying }
})
