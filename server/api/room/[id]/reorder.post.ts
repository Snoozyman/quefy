import { verifyHost, getRoom, reorderQueue } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string; songIds: string[] }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })
  if (!body?.songIds?.length)
    throw createError({ statusCode: 400, statusMessage: 'Missing songIds' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can reorder the queue'
    })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  if (!reorderQueue(id, body.songIds, body.hostToken))
    throw createError({
      statusCode: 400,
      statusMessage: 'Failed to reorder queue'
    })

  emitRoomUpdate(id, room)
  return { success: true }
})
