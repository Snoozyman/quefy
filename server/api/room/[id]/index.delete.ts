export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const { hostToken } = await readBody<{ hostToken: string }>(event)

  if (!hostToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing hostToken'
    })
  }

  const room = await getRoom(id)
  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found'
    })
  }
  if (!verifyHost(room?.id, hostToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can delete the room'
    })
  }

  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found'
    })
  }

  await deleteRoom(id)

  return {
    message: 'Room deleted successfully'
  }
})
