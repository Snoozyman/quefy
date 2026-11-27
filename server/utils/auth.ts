import type { H3Event } from 'h3'
import { verifyHost } from './room'

/**
 * Reject the request unless its `x-room-id` / `x-host-token` headers name a
 * valid room host. Used for server-wide admin actions (cookies) that have no
 * room of their own: the host of any room may perform them.
 */
export function requireRoomHost(event: H3Event, action: string): void {
  const roomId = getHeader(event, 'x-room-id')
  const hostToken = getHeader(event, 'x-host-token')
  if (!roomId || !hostToken) {
    throw createError({
      statusCode: 401,
      statusMessage: `Only a room host can ${action} (missing x-room-id or x-host-token header)`
    })
  }
  if (!verifyHost(roomId, hostToken)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Only a room host can ${action}`
    })
  }
}
