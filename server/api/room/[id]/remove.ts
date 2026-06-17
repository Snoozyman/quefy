import { verifyHost, removeFromQueue, getRoom } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ songId: string, hostToken: string }>(event)
  if (!body?.songId || !body?.hostToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing songId or hostToken'
    })
  }

  if (!verifyHost(id, body.hostToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can remove songs'
    })
  }

  const ok = removeFromQueue(id, body.songId, body.hostToken)
  if (!ok)
    throw createError({ statusCode: 404, statusMessage: 'Song not found' })

  const room = getRoom(id)
  if (room) {
    emitRoomUpdate(id, room)
  }

  return { success: true }
})
