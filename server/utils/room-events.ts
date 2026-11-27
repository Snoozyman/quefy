import type { EventStream } from 'h3'
import { onRoomDeleted, toRoomState } from './room'
import type { Room } from './room'

const roomClients = new Map<string, Set<EventStream>>()
const hostStreams = new Map<string, EventStream>()
const hostGraceTimers = new Map<string, ReturnType<typeof setTimeout>>()

/** How long a host may be disconnected (e.g. SSE reconnect) before pausing. */
export const HOST_GRACE_MS = 15_000

/**
 * Run `onExpire` unless the host reconnects within HOST_GRACE_MS. Stops a
 * brief network blip from pausing the room for everyone.
 */
export function scheduleHostAbsence(roomId: string, onExpire: () => void) {
  cancelHostAbsence(roomId)
  hostGraceTimers.set(
    roomId,
    setTimeout(() => {
      hostGraceTimers.delete(roomId)
      if (!hostStreams.has(roomId)) onExpire()
    }, HOST_GRACE_MS)
  )
}

function cancelHostAbsence(roomId: string) {
  const timer = hostGraceTimers.get(roomId)
  if (timer) clearTimeout(timer)
  hostGraceTimers.delete(roomId)
}

export function registerRoomClient(roomId: string, stream: EventStream): void {
  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set())
  }
  roomClients.get(roomId)!.add(stream)
}

export function registerHostStream(roomId: string, stream: EventStream): void {
  cancelHostAbsence(roomId)
  hostStreams.set(roomId, stream)
  registerRoomClient(roomId, stream)
}

export function isHostDisconnect(roomId: string, stream: EventStream): boolean {
  return hostStreams.get(roomId) === stream
}

export function unregisterRoomClient(
  roomId: string,
  stream: EventStream
): void {
  if (hostStreams.get(roomId) === stream) {
    hostStreams.delete(roomId)
  }
  const clients = roomClients.get(roomId)
  if (clients) {
    clients.delete(stream)
    if (clients.size === 0) {
      roomClients.delete(roomId)
    }
  }
}

export function emitRoomUpdate(roomId: string, room: Room) {
  const clients = roomClients.get(roomId)
  if (!clients || clients.size === 0) return

  const data = JSON.stringify(toRoomState(room))
  for (const stream of clients) {
    stream.push({ data, event: 'room-update' }).catch((err: unknown) => {
      console.error('Failed to push SSE event:', err)
      clients.delete(stream)
    })
  }
}

/** Tell every client the room is gone and close their streams. */
function closeRoomStreams(roomId: string) {
  const clients = roomClients.get(roomId)
  roomClients.delete(roomId)
  hostStreams.delete(roomId)
  cancelHostAbsence(roomId)
  if (!clients) return
  for (const stream of clients) {
    stream
      .push({ event: 'room-deleted', data: roomId })
      .catch(() => {})
      .finally(() => stream.close())
  }
}

// Registered when this module first loads, which happens before any stream
// exists (events.ts imports it), so no open stream can be missed.
onRoomDeleted(closeRoomStreams)
