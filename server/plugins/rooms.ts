import { join } from 'node:path'
import { dataDir } from '#server/utils/data-dir'
import {
  getRoom,
  onRoomsChanged,
  pauseRoom,
  restoreRooms,
  snapshotRooms
} from '#server/utils/room'
import { emitRoomUpdate, scheduleHostAbsence } from '#server/utils/room-events'
import { createFileRoomStore, debounce } from '#server/utils/room-store'

/** Saves are batched: position reports alone arrive every 2s per host. */
const SAVE_DELAY_MS = 1000

/**
 * Keeps rooms across restarts (e.g. a container update): loads saved rooms
 * at startup and saves after changes and on shutdown.
 */
export default defineNitroPlugin((nitroApp) => {
  const path = join(dataDir(), 'rooms.json')
  const store = createFileRoomStore(path)

  try {
    const restored = restoreRooms(store.load())
    if (restored.length) {
      console.info(`[rooms] restored ${restored.length} room(s) from ${path}`)
    }
    // A room that was playing waits for its host to reconnect, and pauses
    // like after any host disconnect if they don't.
    for (const room of restored) {
      if (!room.isPlaying) continue
      scheduleHostAbsence(room.id, () => {
        const current = getRoom(room.id)
        if (current && pauseRoom(room.id)) emitRoomUpdate(room.id, current)
      })
    }
  } catch (err: unknown) {
    console.error(
      `[rooms] could not load saved rooms from ${path}; starting empty:`,
      err instanceof Error ? err.message : err
    )
  }

  const save = debounce(() => {
    try {
      store.save(snapshotRooms())
    } catch (err: unknown) {
      console.error(
        `[rooms] could not save rooms to ${path}:`,
        err instanceof Error ? err.message : err
      )
    }
  }, SAVE_DELAY_MS)

  onRoomsChanged(save)
  nitroApp.hooks.hook('close', () => save.flush())
})
