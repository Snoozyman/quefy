import type { EventStream } from 'h3'
import type { Room } from './room'

const roomClients = new Map<string, Set<EventStream>>()
const hostStreams = new Map<string, EventStream>()

export function registerRoomClient(roomId: string, stream: EventStream): void {
  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set())
  }
  roomClients.get(roomId)!.add(stream)
}

export function registerHostStream(roomId: string, stream: EventStream): void {
  hostStreams.set(roomId, stream)
  registerRoomClient(roomId, stream)
}

export function isHostDisconnect(roomId: string, stream: EventStream): boolean {
  return hostStreams.get(roomId) === stream
}

export function unregisterRoomClient(roomId: string, stream: EventStream): void {
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

  const state = {
    id: room.id,
    title: room.title,
    currentSong: room.currentSong,
    queue: room.queue.map(s => ({
      id: s.id,
      source: s.source,
      title: s.title,
      addedBy: s.addedBy,
      addedAt: s.addedAt,
      videoId: s.videoId,
      url: s.url,
      trackUri: s.trackUri,
      artists: s.artists,
      albumName: s.albumName,
      albumImageUrl: s.albumImageUrl,
      durationMs: s.durationMs
    })),
    isPlaying: room.isPlaying,
    spotifyConnected: room.spotifyConnected,
    createdAt: room.createdAt,
    position: room.position
  }

  const data = JSON.stringify(state)
  clients.forEach((stream) => {
    try {
      stream.push({ data, event: 'room-update' })
    } catch (err: unknown) {
      console.error('Failed to push SSE event:', err)
      clients.delete(stream)
    }
  })
}
