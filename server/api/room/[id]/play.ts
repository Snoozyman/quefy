import { verifyHost, togglePlay, getRoom, skipSong } from '#server/utils/room'

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
      statusMessage: 'Only the host can control playback'
    })
  }

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  if (!room.currentSong && room.queue.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Queue is empty' })
  }

  if (!room.currentSong && room.queue.length > 0) {
    room.currentSong = room.queue.shift()!
  }

  room.isPlaying = !room.isPlaying

  return {
    isPlaying: room.isPlaying,
    currentSong: room.currentSong
  }
})
