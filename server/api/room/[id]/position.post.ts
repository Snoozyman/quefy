import { verifyHost, getRoom } from '#server/utils/room'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string; position: number }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can update position'
    })

  if (typeof body.position !== 'number' || !isFinite(body.position))
    throw createError({ statusCode: 400, statusMessage: 'Invalid position' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  room.position = Math.max(0, Math.round(body.position))
  return { ok: true }
})
