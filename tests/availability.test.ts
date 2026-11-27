import { expect, test, describe } from 'bun:test'
import { waitUntilAvailable } from '../server/utils/yt-dlp'

describe('waitUntilAvailable', () => {
  test('no wait without a valid available_at', async () => {
    expect(await waitUntilAvailable({})).toBe(0)
    expect(await waitUntilAvailable({ available_at: 'soon' })).toBe(0)
  })

  test('no wait when already available', async () => {
    const now = Date.now()
    expect(
      await waitUntilAvailable({ available_at: now / 1000 - 10 }, now)
    ).toBe(0)
  })

  test('waits until available_at plus a small margin', async () => {
    const now = Date.now()
    const start = performance.now()
    const waited = await waitUntilAvailable(
      { available_at: (now + 100) / 1000 },
      now
    )
    expect(waited).toBe(350)
    expect(performance.now() - start).toBeGreaterThanOrEqual(340)
  })
})
