import { randomUUID } from "node:crypto";

export interface QueuedSong {
  id: string;
  videoId: string;
  title: string;
  url: string;
  addedBy: string;
  addedAt: number;
}

export interface Room {
  id: string;
  title: string;
  hostToken: string;
  queue: QueuedSong[];
  currentSong: QueuedSong | null;
  isPlaying: boolean;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function generateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id: string;
  do {
    id = "";
    for (let i = 0; i < 4; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(id));
  return id;
}

export function createRoom(title?: string): Room {
  const room: Room = {
    id: generateId(),
    title: (title || "").trim() || `${generateId()}'s Room`,
    hostToken: randomUUID(),
    queue: [],
    currentSong: null,
    isPlaying: false,
    createdAt: Date.now(),
  };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function verifyHost(roomId: string, token: string): boolean {
  const room = rooms.get(roomId);
  return room?.hostToken === token;
}

export function addToQueue(
  roomId: string,
  videoId: string,
  title: string,
  url: string,
  addedBy: string,
): QueuedSong | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const song: QueuedSong = {
    id: randomUUID(),
    videoId,
    title,
    url,
    addedBy: addedBy || "Anonymous",
    addedAt: Date.now(),
  };
  room.queue.push(song);
  return song;
}

export function removeFromQueue(
  roomId: string,
  songId: string,
  hostToken: string,
): boolean {
  const room = rooms.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;
  const idx = room.queue.findIndex((s) => s.id === songId);
  if (idx === -1) return false;
  room.queue.splice(idx, 1);
  return true;
}

export function togglePlay(roomId: string, hostToken: string): boolean {
  const room = rooms.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;
  if (!room.currentSong && room.queue.length === 0) return false;
  if (!room.currentSong) {
    room.currentSong = room.queue.shift()!;
  }
  room.isPlaying = !room.isPlaying;
  return true;
}

export function skipSong(roomId: string, hostToken: string): QueuedSong | null {
  const room = rooms.get(roomId);
  if (!room || room.hostToken !== hostToken) return null;
  if (room.queue.length === 0) {
    room.currentSong = null;
    room.isPlaying = false;
    return null;
  }
  room.currentSong = room.queue.shift()!;
  return room.currentSong;
}

export function exportRoom(roomId: string): object | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    id: room.id,
    title: room.title,
    createdAt: room.createdAt,
    currentSong: room.currentSong,
    queue: room.queue,
  };
}

export function listRooms(): RoomSummary[] {
  const now = Date.now();
  const entries = Array.from(rooms.values());
  entries.sort((a, b) => b.createdAt - a.createdAt);
  // Prune rooms older than 24h
  const pruned = entries.filter((r) => now - r.createdAt < 86_400_000);
  return pruned.map((r) => ({
    id: r.id,
    title: r.title,
    queueCount: r.queue.length + (r.currentSong ? 1 : 0),
    createdAt: r.createdAt,
  }));
}

interface RoomSummary {
  id: string;
  title: string;
  queueCount: number;
  createdAt: number;
}
