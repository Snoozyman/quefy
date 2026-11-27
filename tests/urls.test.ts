import { expect, test, describe } from 'bun:test'
import {
  isSoundcloudUrl,
  isYoutubePlaylistUrl,
  isYoutubeVideoId
} from '../shared/utils/urls'

describe('isSoundcloudUrl', () => {
  test('accepts soundcloud track and short links', () => {
    expect(isSoundcloudUrl('https://soundcloud.com/artist/track')).toBe(true)
    expect(isSoundcloudUrl('https://m.soundcloud.com/artist/track')).toBe(true)
    expect(isSoundcloudUrl('https://on.soundcloud.com/abc123')).toBe(true)
  })

  test('rejects other hosts, schemes and option-like input', () => {
    expect(isSoundcloudUrl('https://evil.com/soundcloud.com/x')).toBe(false)
    expect(isSoundcloudUrl('https://soundcloud.com.evil.com/x')).toBe(false)
    expect(isSoundcloudUrl('http://169.254.169.254/latest')).toBe(false)
    expect(isSoundcloudUrl('file:///etc/passwd')).toBe(false)
    expect(isSoundcloudUrl('--exec=touch /tmp/x')).toBe(false)
    expect(isSoundcloudUrl('')).toBe(false)
  })
})

describe('isYoutubePlaylistUrl', () => {
  test('accepts youtube urls with a list id', () => {
    expect(
      isYoutubePlaylistUrl('https://www.youtube.com/playlist?list=PL123')
    ).toBe(true)
    expect(
      isYoutubePlaylistUrl('https://youtu.be/dQw4w9WgXcQ?list=PL123')
    ).toBe(true)
  })

  test('rejects non-youtube hosts and missing list', () => {
    expect(isYoutubePlaylistUrl('https://evil.com/?list=PL123')).toBe(false)
    expect(
      isYoutubePlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(false)
  })
})

describe('isYoutubeVideoId', () => {
  test('accepts 11-char ids only', () => {
    expect(isYoutubeVideoId('dQw4w9WgXcQ')).toBe(true)
    expect(isYoutubeVideoId('abc-_123XYZ')).toBe(true)
    expect(isYoutubeVideoId('short')).toBe(false)
    expect(isYoutubeVideoId('dQw4w9WgXcQ&x=1')).toBe(false)
  })
})
