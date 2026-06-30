import { verifyHost } from '#server/utils/room'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ roomId?: string, hostToken?: string }>(event)

  if (!body?.roomId || !body?.hostToken) {
    throw createError({ statusCode: 400, statusMessage: 'Missing roomId or hostToken' })
  }

  return { isHost: verifyHost(body.roomId, body.hostToken) }
})
