import { randomUUID } from 'node:crypto'

export interface QueuedSong {
  id: string
  source: 'youtube' | 'spotify' | 'soundcloud'
  title: string
  addedBy: string
  addedAt: number
  // YouTube
  videoId?: string
  url?: string
  // Spotify
  trackUri?: string
  // SoundCloud
  trackUrl?: string
  artists?: string[]
  albumName?: string
  albumImageUrl?: string
  durationMs?: number
}

export interface Room {
  id: string
  title: string
  hostToken: string
  queue: QueuedSong[]
  currentSong: QueuedSong | null
  isPlaying: boolean
  spotifyConnected: boolean
  createdAt: number
  position: number
}

const rooms = new Map<string, Room>()

function generateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id: string
  do {
    id = ''
    for (let i = 0; i < 4; i++) {
      id += chars[Math.floor(Math.random() * chars.length)]
    }
  } while (rooms.has(id))
  return id
}

export function createRoom(title?: string): Room {
  const room: Room = {
    id: generateId(),
    title: (title || '').trim() || `${generateId()}'s Room`,
    hostToken: randomUUID(),
    queue: [],
    currentSong: null,
    isPlaying: false,
    spotifyConnected: false,
    createdAt: Date.now(),
    position: 0
  }
  rooms.set(room.id, room)
  return room
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id)
}

export function deleteRoom(id: string): boolean {
  return rooms.delete(id)
}

export function verifyHost(roomId: string, token: string): boolean {
  const room = rooms.get(roomId)
  return room?.hostToken === token
}

export function setSpotifyConnected(
  roomId: string,
  connected: boolean
): boolean {
  const room = rooms.get(roomId)
  if (!room) return false
  room.spotifyConnected = connected
  return true
}

export function addToQueue(
  roomId: string,
  data: {
    source: 'youtube' | 'spotify' | 'soundcloud'
    title: string
    addedBy: string
    videoId?: string
    url?: string
    trackUri?: string
    trackUrl?: string
    artists?: string[]
    albumName?: string
    albumImageUrl?: string
    durationMs?: number
  }
): QueuedSong | null {
  const room = rooms.get(roomId)
  if (!room) return null
  const song: QueuedSong = {
    id: randomUUID(),
    source: data.source,
    title: data.title,
    addedBy: data.addedBy || 'Anonymous',
    addedAt: Date.now(),
    videoId: data.videoId,
    url: data.url,
    trackUri: data.trackUri,
    trackUrl: data.trackUrl,
    artists: data.artists,
    albumName: data.albumName,
    albumImageUrl: data.albumImageUrl,
    durationMs: data.durationMs
  }
  room.queue.push(song)
  return song
}

export function bulkAddToQueue(
  roomId: string,
  songs: Array<{
    source: 'youtube' | 'spotify' | 'soundcloud'
    title: string
    addedBy: string
    videoId?: string
    url?: string
    trackUri?: string
    trackUrl?: string
    artists?: string[]
    albumName?: string
    albumImageUrl?: string
    durationMs?: number
  }>
): QueuedSong[] {
  const room = rooms.get(roomId)
  if (!room) return []
  const now = Date.now()
  const added: QueuedSong[] = []
  for (const data of songs) {
    const song: QueuedSong = {
      id: randomUUID(),
      source: data.source,
      title: data.title,
      addedBy: data.addedBy || 'Anonymous',
      addedAt: now,
      videoId: data.videoId,
      url: data.url,
      trackUri: data.trackUri,
      trackUrl: data.trackUrl,
      artists: data.artists,
      albumName: data.albumName,
      albumImageUrl: data.albumImageUrl,
      durationMs: data.durationMs
    }
    room.queue.push(song)
    added.push(song)
  }
  return added
}

export function reorderQueue(
  roomId: string,
  songIds: string[],
  hostToken: string
): boolean {
  const room = rooms.get(roomId)
  if (!room || room.hostToken !== hostToken) return false
  if (songIds.length !== room.queue.length) return false
  const songMap = new Map(room.queue.map(s => [s.id, s]))
  for (const id of songIds) {
    if (!songMap.has(id)) return false
  }
  room.queue = songIds.map(id => songMap.get(id)!)
  return true
}

export function removeFromQueue(
  roomId: string,
  songId: string,
  hostToken: string
): boolean {
  const room = rooms.get(roomId)
  if (!room || room.hostToken !== hostToken) return false
  const idx = room.queue.findIndex((s) => s.id === songId)
  if (idx === -1) return false
  room.queue.splice(idx, 1)
  return true
}

export function togglePlay(roomId: string, hostToken: string): boolean {
  const room = rooms.get(roomId)
  if (!room || room.hostToken !== hostToken) return false
  if (!room.currentSong && room.queue.length === 0) return false
  if (!room.currentSong) {
    room.currentSong = room.queue.shift()!
  }
  room.isPlaying = !room.isPlaying
  return true
}

export function skipSong(roomId: string, hostToken: string): QueuedSong | null {
  const room = rooms.get(roomId)
  if (!room || room.hostToken !== hostToken) return null
  if (room.queue.length === 0) {
    room.currentSong = null
    room.isPlaying = false
    return null
  }
  room.currentSong = room.queue.shift()!
  return room.currentSong
}

export function exportRoom(roomId: string): object | null {
  const room = rooms.get(roomId)
  if (!room) return null
  return {
    id: room.id,
    title: room.title,
    createdAt: room.createdAt,
    currentSong: room.currentSong,
    queue: room.queue
  }
}

export function listRooms(): RoomSummary[] {
  const now = Date.now()
  const entries = Array.from(rooms.values())
  entries.sort((a, b) => b.createdAt - a.createdAt)
  const expiry = 86_400_000
  for (const [id, r] of rooms) {
    if (now - r.createdAt >= expiry) rooms.delete(id)
  }
  return entries
    .filter((r) => now - r.createdAt < expiry)
    .map((r) => ({
      id: r.id,
      title: r.title,
      queueCount: r.queue.length + (r.currentSong ? 1 : 0),
      createdAt: r.createdAt,
      isPlaying: r.isPlaying,
      currentSource: r.currentSong?.source ?? null,
      currentThumbnail: r.currentSong?.albumImageUrl ?? null
    }))
}

interface RoomSummary {
  id: string
  title: string
  queueCount: number
  createdAt: number
  isPlaying: boolean
  currentSource: string | null
  currentThumbnail: string | null
}
