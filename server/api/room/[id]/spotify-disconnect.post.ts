import { verifyHost, setSpotifyConnected, getRoom } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const body = await readBody<{ hostToken: string }>(event)
  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({ statusCode: 403, statusMessage: 'Only the host can disconnect Spotify' })

  setSpotifyConnected(id, false)

  const room = getRoom(id)
  if (room) emitRoomUpdate(id, room)

  return { ok: true }
})
