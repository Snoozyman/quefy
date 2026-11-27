import { expect, test, describe } from 'bun:test'
import { redactPath } from '../server/utils/logger'

describe('redactPath', () => {
  test('redacts host tokens and OAuth secrets', () => {
    expect(redactPath('/api/room/AB12/events?hostToken=secret')).toBe(
      '/api/room/AB12/events?hostToken=***'
    )
    expect(redactPath('/api/spotify/callback?code=abc&state=AB12:x')).toBe(
      '/api/spotify/callback?code=***&state=***'
    )
  })

  test('keeps non-secret params and plain paths', () => {
    expect(redactPath('/api/youtube/search?q=hello&limit=5')).toBe(
      '/api/youtube/search?q=hello&limit=5'
    )
    expect(redactPath('/api/room/AB12')).toBe('/api/room/AB12')
  })
})
