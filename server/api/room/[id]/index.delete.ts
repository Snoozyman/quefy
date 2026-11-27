import { deleteRoom, getRoom, verifyHost } from '#server/utils/room'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken?: string }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!getRoom(id))
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can delete the room'
    })

  // Also closes every client's event stream (see room-events.ts).
  deleteRoom(id)

  return { message: 'Room deleted successfully' }
})
