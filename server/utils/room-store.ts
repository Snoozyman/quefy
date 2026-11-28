import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'node:fs'
import { dirname } from 'node:path'
import type { Room } from './room'

const VERSION = 1

export interface RoomStore {
  load: () => Room[]
  save: (rooms: Room[]) => void
}

function isSong(value: unknown): boolean {
  const s = value as Record<string, unknown> | null
  return (
    !!s &&
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    (s.source === 'youtube' || s.source === 'spotify' || s.source === 'soundcloud')
  )
}

/** Loose shape check, so a hand-edited or old file can't crash the server. */
export function isRoom(value: unknown): value is Room {
  const r = value as Record<string, unknown> | null
  return (
    !!r &&
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.hostToken === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.position === 'number' &&
    typeof r.isPlaying === 'boolean' &&
    Array.isArray(r.queue) &&
    r.queue.every(isSong) &&
    (r.currentSong === null || isSong(r.currentSong))
  )
}

/**
 * Rooms saved as JSON. Writes go to a temp file that is renamed into place,
 * so a crash mid-write never leaves a truncated file. The file holds host
 * tokens, so it is only readable by the owner.
 */
export function createFileRoomStore(path: string): RoomStore {
  return {
    load() {
      if (!existsSync(path)) return []
      const data = JSON.parse(readFileSync(path, 'utf-8')) as {
        version?: unknown
        rooms?: unknown
      }
      if (data.version !== VERSION || !Array.isArray(data.rooms)) return []
      return data.rooms.filter(isRoom)
    },
    save(rooms) {
      mkdirSync(dirname(path), { recursive: true })
      const tmp = `${path}.tmp`
      writeFileSync(tmp, JSON.stringify({ version: VERSION, rooms }), {
        encoding: 'utf-8',
        mode: 0o600
      })
      renameSync(tmp, path)
    }
  }
}

/**
 * Run `fn` once, `ms` after the last call. `flush()` runs a pending call now
 * (used on shutdown).
 */
export function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = () => {
    timer = undefined
    fn()
  }
  const call = () => {
    clearTimeout(timer)
    timer = setTimeout(run, ms)
  }
  call.flush = () => {
    if (!timer) return
    clearTimeout(timer)
    run()
  }
  return call
}
