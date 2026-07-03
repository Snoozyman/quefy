import { expect, test, describe } from 'bun:test'
import {
  createRoom,
  getRoom,
  verifyHost,
  addToQueue,
  removeFromQueue,
  togglePlay,
  skipSong,
  exportRoom,
  listRooms
} from '../server/utils/room'

describe('createRoom', () => {
  test('creates a room with expected structure', () => {
    const room = createRoom()
    expect(room.id).toMatch(/^[A-Z0-9]{4}$/)
    expect(room.hostToken).toBeTruthy()
    expect(room.queue).toEqual([])
    expect(room.currentSong).toBeNull()
    expect(room.isPlaying).toBe(false)
    expect(room.createdAt).toBeGreaterThan(0)
    expect(room.title).toBeTruthy()
  })

  test('creates room with custom title', () => {
    const room = createRoom('My Jam Session')
    expect(room.title).toBe('My Jam Session')
  })

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createRoom().id))
    expect(ids.size).toBe(50)
  })
})

describe('getRoom', () => {
  test('returns undefined for non-existent room', () => {
    expect(getRoom('NONEXIST')).toBeUndefined()
  })

  test('returns the created room', () => {
    const room = createRoom()
    const found = getRoom(room.id)
    expect(found).toBeDefined()
    expect(found!.id).toBe(room.id)
    expect(found!.hostToken).toBe(room.hostToken)
  })
})

describe('verifyHost', () => {
  test('returns true for correct token', () => {
    const room = createRoom()
    expect(verifyHost(room.id, room.hostToken)).toBe(true)
  })

  test('returns false for wrong token', () => {
    const room = createRoom()
    expect(verifyHost(room.id, 'wrong-token')).toBe(false)
  })

  test('returns false for non-existent room', () => {
    expect(verifyHost('NOPE', 'anything')).toBe(false)
  })
})

describe('addToQueue', () => {
  test('adds a song to the queue', () => {
    const room = createRoom()
    const song = addToQueue(room.id, {
      source: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      url: 'https://example.com/audio',
      addedBy: 'Alice'
    })
    expect(song).not.toBeNull()
    expect(song!.id).toBeTruthy()
    expect(song!.videoId).toBe('dQw4w9WgXcQ')
    expect(song!.title).toBe('Never Gonna Give You Up')
    expect(song!.addedBy).toBe('Alice')
    expect(song!.addedAt).toBeGreaterThan(0)

    const updated = getRoom(room.id)
    expect(updated!.queue).toHaveLength(1)
    expect(updated!.queue[0]!.id).toBe(song!.id)
  })

  test('defaults addedBy to Anonymous', () => {
    const room = createRoom()
    const song = addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Test',
      url: 'url',
      addedBy: ''
    })
    expect(song!.addedBy).toBe('Anonymous')
  })

  test('returns null for non-existent room', () => {
    const song = addToQueue('NOPE', {
      source: 'youtube',
      videoId: 'abc',
      title: 'Test',
      url: 'url',
      addedBy: 'Alice'
    })
    expect(song).toBeNull()
  })
})

describe('removeFromQueue', () => {
  test('removes a song by id', () => {
    const room = createRoom()
    const song = addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Test',
      url: 'url',
      addedBy: 'Alice'
    })!
    const ok = removeFromQueue(room.id, song.id, room.hostToken)
    expect(ok).toBe(true)
    expect(getRoom(room.id)!.queue).toHaveLength(0)
  })

  test('rejects removal with wrong host token', () => {
    const room = createRoom()
    const song = addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Test',
      url: 'url',
      addedBy: 'Alice'
    })!
    const ok = removeFromQueue(room.id, song.id, 'wrong-token')
    expect(ok).toBe(false)
    expect(getRoom(room.id)!.queue).toHaveLength(1)
  })

  test('returns false for non-existent song', () => {
    const room = createRoom()
    const ok = removeFromQueue(room.id, 'no-such-id', room.hostToken)
    expect(ok).toBe(false)
  })
})

describe('togglePlay', () => {
  test('starts playing when queue has songs', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    const result = togglePlay(room.id, room.hostToken)
    expect(result).toBe(true)

    const updated = getRoom(room.id)!
    expect(updated.isPlaying).toBe(true)
    expect(updated.currentSong).not.toBeNull()
    expect(updated.currentSong!.title).toBe('Song A')
    expect(updated.queue).toHaveLength(0)
  })

  test('toggles play/pause', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    togglePlay(room.id, room.hostToken) // play
    const paused = togglePlay(room.id, room.hostToken) // pause
    expect(paused).toBe(true)
    expect(getRoom(room.id)!.isPlaying).toBe(false)

    const played = togglePlay(room.id, room.hostToken) // play again
    expect(played).toBe(true)
    expect(getRoom(room.id)!.isPlaying).toBe(true)
  })

  test('fails with empty queue and no current song', () => {
    const room = createRoom()
    const result = togglePlay(room.id, room.hostToken)
    expect(result).toBe(false)
  })

  test('fails with wrong host token', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    const result = togglePlay(room.id, 'wrong-token')
    expect(result).toBe(false)
  })
})

describe('skipSong', () => {
  test('advances to the next song in queue', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'def',
      title: 'Song B',
      url: 'url',
      addedBy: 'Bob'
    })
    togglePlay(room.id, room.hostToken) // starts playing Song A, queue has [Song B]

    expect(getRoom(room.id)!.currentSong!.title).toBe('Song A')

    const next = skipSong(room.id, room.hostToken)
    expect(next).not.toBeNull()
    expect(next!.title).toBe('Song B')
    expect(getRoom(room.id)!.currentSong!.title).toBe('Song B')
    expect(getRoom(room.id)!.queue).toHaveLength(0)
  })

  test('returns null and clears current when queue is empty', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    togglePlay(room.id, room.hostToken) // plays Song A, queue empty

    const result = skipSong(room.id, room.hostToken)
    expect(result).toBeNull()
    expect(getRoom(room.id)!.currentSong).toBeNull()
    expect(getRoom(room.id)!.isPlaying).toBe(false)
  })

  test('fails with wrong host token', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    togglePlay(room.id, room.hostToken)

    const result = skipSong(room.id, 'wrong-token')
    expect(result).toBeNull()
  })
})

describe('exportRoom', () => {
  test('returns room data as plain object', () => {
    const room = createRoom()
    addToQueue(room.id, {
      source: 'youtube',
      videoId: 'abc',
      title: 'Song A',
      url: 'url',
      addedBy: 'Alice'
    })
    togglePlay(room.id, room.hostToken)

    const data = exportRoom(room.id)!
    expect(data).not.toBeNull()
    expect(data).toHaveProperty('id', room.id)
    expect(data).toHaveProperty('queue')
    expect(data).toHaveProperty('currentSong')
    expect(data).not.toHaveProperty('hostToken')
  })

  test('returns null for non-existent room', () => {
    expect(exportRoom('NOPE')).toBeNull()
  })
})

describe('listRooms', () => {
  test('returns active rooms with summary fields', () => {
    const r1 = createRoom('Room A')
    const r2 = createRoom('Room B')
    const rooms = listRooms()
    expect(rooms.length).toBeGreaterThanOrEqual(2)
    const found = rooms.filter((r) => r.id === r1.id || r.id === r2.id)
    expect(found).toHaveLength(2)
    for (const r of found) {
      expect(r).toHaveProperty('title')
      expect(r).toHaveProperty('queueCount')
      expect(r).toHaveProperty('createdAt')
    }
  })
})
