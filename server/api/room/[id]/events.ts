import {
  getRoom,
  pauseRoom,
  toRoomState,
  verifyHost
} from '#server/utils/room'
import {
  registerHostStream,
  registerRoomClient,
  unregisterRoomClient,
  isHostDisconnect,
  emitRoomUpdate,
  scheduleHostAbsence
} from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })
  }

  const room = getRoom(id)
  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })
  }

  const hostToken = getQuery(event).hostToken as string | undefined
  const isHost = hostToken && verifyHost(id, hostToken)

  const stream = createEventStream(event)
  if (isHost) {
    registerHostStream(id, stream)
  } else {
    registerRoomClient(id, stream)
  }

  stream
    .push({ event: 'room-update', data: JSON.stringify(toRoomState(room)) })
    .catch(() => {})

  stream.onClosed(() => {
    const wasHost = isHostDisconnect(id, stream)
    unregisterRoomClient(id, stream)
    if (wasHost) {
      scheduleHostAbsence(id, () => {
        const current = getRoom(id)
        if (current && pauseRoom(id)) emitRoomUpdate(id, current)
      })
    }
  })

  return stream.send()
})
