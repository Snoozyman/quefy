import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  addToQueue,
  createRoom,
  deleteRoom,
  getRoom,
  onRoomsChanged,
  restoreRooms,
  ROOM_TTL_MS,
  snapshotRooms,
  togglePlay,
  type Room
} from '../server/utils/room'
import { createFileRoomStore, debounce, isRoom } from '../server/utils/room-store'
import { dataDir } from '../server/utils/data-dir'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'quefy-rooms-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  onRoomsChanged(null)
})

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: 'ZZ' + Math.random().toString(36).slice(2, 4).toUpperCase(),
    title: 'Saved',
    hostToken: 'token',
    queue: [
      { id: 'q1', source: 'youtube', title: 'A', addedBy: 'x', addedAt: 1, videoId: 'v' }
    ],
    currentSong: null,
    isPlaying: false,
    spotifyConnected: false,
    createdAt: Date.now(),
    position: 0,
    ...overrides
  }
}

describe('file room store', () => {
  test('saves and loads rooms', () => {
    const store = createFileRoomStore(join(dir, 'sub', 'rooms.json'))
    const r = room()
    store.save([r])
    expect(store.load()).toEqual([r])
  })

  test('the saved file is private to the owner', () => {
    const path = join(dir, 'rooms.json')
    createFileRoomStore(path).save([room()])
    expect(statSync(path).mode & 0o777).toBe(0o600)
  })

  test('a missing file loads as no rooms', () => {
    expect(createFileRoomStore(join(dir, 'none.json')).load()).toEqual([])
  })

  test('drops malformed rooms and ignores other versions', () => {
    const path = join(dir, 'rooms.json')
    writeFileSync(path, JSON.stringify({ version: 1, rooms: [room(), { id: 3 }] }))
    expect(createFileRoomStore(path).load()).toHaveLength(1)
    writeFileSync(path, JSON.stringify({ version: 99, rooms: [room()] }))
    expect(createFileRoomStore(path).load()).toEqual([])
  })

  test('isRoom rejects bad songs', () => {
    expect(isRoom(room({ currentSong: { id: 1 } as never }))).toBe(false)
  })
})

describe('restoring and change tracking', () => {
  test('restores live rooms with their host token and queue', () => {
    const saved = room()
    expect(restoreRooms([saved])).toEqual([saved])
    const back = getRoom(saved.id)
    expect(back?.hostToken).toBe('token')
    expect(back?.queue[0]?.title).toBe('A')
    deleteRoom(saved.id)
  })

  test('skips expired rooms and ids already in use', () => {
    const live = createRoom('live')
    const expired = room({ createdAt: Date.now() - ROOM_TTL_MS - 1 })
    const clash = room({ id: live.id, title: 'other' })
    expect(restoreRooms([expired, clash])).toEqual([])
    expect(getRoom(live.id)?.title).toBe('live')
    deleteRoom(live.id)
  })

  test('every change notifies the listener, and snapshots include it', () => {
    let changes = 0
    onRoomsChanged(() => changes++)
    const r = createRoom('tracked')
    addToQueue(r.id, { source: 'youtube', title: 'x', addedBy: 'y', videoId: 'v' })
    togglePlay(r.id, r.hostToken)
    expect(changes).toBe(3)
    expect(snapshotRooms().find((s) => s.id === r.id)?.isPlaying).toBe(true)
    deleteRoom(r.id)
    expect(changes).toBe(4)
  })
})

describe('debounce', () => {
  test('runs once after calls stop, and flush runs a pending call now', async () => {
    let runs = 0
    const save = debounce(() => runs++, 20)
    save()
    save()
    save()
    expect(runs).toBe(0)
    await new Promise((r) => setTimeout(r, 40))
    expect(runs).toBe(1)
    save()
    save.flush()
    expect(runs).toBe(2)
    save.flush()
    expect(runs).toBe(2)
  })
})

describe('dataDir', () => {
  test('prefers DATA_DIR, then the cookie folder, then ./data', () => {
    expect(dataDir({ DATA_DIR: '/x', YT_DLP_COOKIES: '/data/c.txt' })).toBe('/x')
    expect(dataDir({ YT_DLP_COOKIES: '/data/cookies.txt' })).toBe('/data')
    expect(dataDir({})).toBe(join(process.cwd(), 'data'))
  })
})

