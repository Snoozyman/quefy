import { randomUUID } from 'node:crypto'
import type { RoomState, SongData } from '#shared/types/room'

/** A song as stored server-side: identical to what clients receive. */
export type QueuedSong = SongData

/** Fields a caller supplies when queueing a song; the rest are generated. */
export type NewSong = Omit<SongData, 'id' | 'addedAt'>

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

export interface RoomSummary {
  id: string
  title: string
  queueCount: number
  createdAt: number
  isPlaying: boolean
  currentSource: string | null
  currentThumbnail: string | null
}

/**
 * Rooms are kept in memory (saved to disk by the rooms plugin, see
 * onRoomsChanged) and expire this long after creation.
 */
export const ROOM_TTL_MS = 86_400_000

const rooms = new Map<string, Room>()
const deleteListeners: Array<(roomId: string) => void> = []
let changeListener: (() => void) | null = null

/** Register a callback run whenever a room is deleted or expires. */
export function onRoomDeleted(listener: (roomId: string) => void): void {
  deleteListeners.push(listener)
}

/**
 * Register the callback run after any room changes (used to save rooms).
 * This module never touches the disk itself.
 */
export function onRoomsChanged(listener: (() => void) | null): void {
  changeListener = listener
}

function changed(): void {
  changeListener?.()
}

/** All live rooms, e.g. to save them. */
export function snapshotRooms(): Room[] {
  purgeExpired()
  return Array.from(rooms.values())
}

/**
 * Put saved rooms back after a restart. Expired rooms and ids already in
 * use are skipped. Returns the rooms restored.
 */
export function restoreRooms(saved: Room[], now = Date.now()): Room[] {
  const restored: Room[] = []
  for (const room of saved) {
    if (rooms.has(room.id) || isExpired(room, now)) continue
    rooms.set(room.id, room)
    restored.push(room)
  }
  return restored
}

function isExpired(room: Room, now = Date.now()): boolean {
  return now - room.createdAt >= ROOM_TTL_MS
}

function removeRoom(id: string): boolean {
  const existed = rooms.delete(id)
  if (existed) {
    for (const listener of deleteListeners) listener(id)
    changed()
  }
  return existed
}

function purgeExpired(now = Date.now()): void {
  for (const [id, room] of rooms) {
    if (isExpired(room, now)) removeRoom(id)
  }
}

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
  purgeExpired()
  const id = generateId()
  const room: Room = {
    id,
    title: (title || '').trim() || `${id}'s Room`,
    hostToken: randomUUID(),
    queue: [],
    currentSong: null,
    isPlaying: false,
    spotifyConnected: false,
    createdAt: Date.now(),
    position: 0
  }
  rooms.set(room.id, room)
  changed()
  return room
}

/** Returns the room, or undefined if it never existed or has expired. */
export function getRoom(id: string): Room | undefined {
  const room = rooms.get(id)
  if (room && isExpired(room)) {
    removeRoom(id)
    return undefined
  }
  return room
}

export function deleteRoom(id: string): boolean {
  return removeRoom(id)
}

/** The public view of a room sent to clients (everything but the token). */
export function toRoomState(room: Room): RoomState {
  return {
    id: room.id,
    title: room.title,
    currentSong: room.currentSong,
    queue: room.queue,
    isPlaying: room.isPlaying,
    spotifyConnected: room.spotifyConnected,
    createdAt: room.createdAt,
    position: room.position
  }
}

export function verifyHost(roomId: string, token: string): boolean {
  return getRoom(roomId)?.hostToken === token
}

export function setSpotifyConnected(
  roomId: string,
  connected: boolean
): boolean {
  const room = getRoom(roomId)
  if (!room) return false
  room.spotifyConnected = connected
  changed()
  return true
}

export function setPosition(roomId: string, positionMs: number): boolean {
  const room = getRoom(roomId)
  if (!room) return false
  room.position = Math.max(0, Math.round(positionMs))
  changed()
  return true
}

function buildSong(data: NewSong, addedAt: number): QueuedSong {
  return {
    ...data,
    id: randomUUID(),
    addedBy: data.addedBy || 'Anonymous',
    addedAt
  }
}

export function addToQueue(roomId: string, data: NewSong): QueuedSong | null {
  const room = getRoom(roomId)
  if (!room) return null
  const song = buildSong(data, Date.now())
  room.queue.push(song)
  changed()
  return song
}

export function bulkAddToQueue(roomId: string, songs: NewSong[]): QueuedSong[] {
  const room = getRoom(roomId)
  if (!room) return []
  const now = Date.now()
  const added = songs.map((data) => buildSong(data, now))
  room.queue.push(...added)
  changed()
  return added
}

export function reorderQueue(
  roomId: string,
  songIds: string[],
  hostToken: string
): boolean {
  const room = getRoom(roomId)
  if (!room || room.hostToken !== hostToken) return false
  if (songIds.length !== room.queue.length) return false
  const songMap = new Map(room.queue.map((s) => [s.id, s]))
  if (new Set(songIds).size !== songIds.length) return false
  for (const id of songIds) {
    if (!songMap.has(id)) return false
  }
  room.queue = songIds.map((id) => songMap.get(id)!)
  changed()
  return true
}

export function removeFromQueue(
  roomId: string,
  songId: string,
  hostToken: string
): boolean {
  const room = getRoom(roomId)
  if (!room || room.hostToken !== hostToken) return false
  const idx = room.queue.findIndex((s) => s.id === songId)
  if (idx === -1) return false
  room.queue.splice(idx, 1)
  changed()
  return true
}

/**
 * Toggle play/pause, loading the first queued song if nothing is current.
 * Returns false if the token is wrong or there is nothing to play.
 */
export function togglePlay(roomId: string, hostToken: string): boolean {
  const room = getRoom(roomId)
  if (!room || room.hostToken !== hostToken) return false
  if (!room.currentSong && room.queue.length === 0) return false
  if (!room.currentSong) {
    room.currentSong = room.queue.shift()!
    room.position = 0
  }
  room.isPlaying = !room.isPlaying
  changed()
  return true
}

/** Pause without toggling (used when the host goes away). */
export function pauseRoom(roomId: string): boolean {
  const room = getRoom(roomId)
  if (!room || !room.isPlaying) return false
  room.isPlaying = false
  changed()
  return true
}

/**
 * Advance to the next queued song and reset the position. With an empty
 * queue, clears the current song and stops. Returns the new current song.
 */
export function skipSong(roomId: string, hostToken: string): QueuedSong | null {
  const room = getRoom(roomId)
  if (!room || room.hostToken !== hostToken) return null
  room.position = 0
  changed()
  if (room.queue.length === 0) {
    room.currentSong = null
    room.isPlaying = false
    return null
  }
  room.currentSong = room.queue.shift()!
  return room.currentSong
}

export function exportRoom(roomId: string): {
  id: string
  title: string
  createdAt: number
  currentSong: QueuedSong | null
  queue: QueuedSong[]
} | null {
  const room = getRoom(roomId)
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
  purgeExpired()
  return Array.from(rooms.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({
      id: r.id,
      title: r.title,
      queueCount: r.queue.length + (r.currentSong ? 1 : 0),
      createdAt: r.createdAt,
      isPlaying: r.isPlaying,
      currentSource: r.currentSong?.source ?? null,
      // Idle rooms show what's up next rather than a blank tile
      currentThumbnail:
        (r.currentSong ?? r.queue[0])?.albumImageUrl ?? null
    }))
}
