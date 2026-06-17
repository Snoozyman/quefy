import { expect, test, describe } from 'bun:test'
import { parseYtDlpError } from '../server/utils/yt-dlp-errors'

describe('parseYtDlpError', () => {
  test('detects age-restricted videos', () => {
    expect(parseYtDlpError('ERROR: Sign in to confirm your age')).toContain(
      'age-restricted'
    )
    expect(parseYtDlpError('This video is age-restricted')).toContain(
      'age-restricted'
    )
  })

  test('detects member-only videos', () => {
    expect(
      parseYtDlpError('This video is only available to members')
    ).toContain('members-only')
  })

  test('detects private videos', () => {
    expect(parseYtDlpError('ERROR: Private video')).toContain('private')
  })

  test('detects unavailable videos', () => {
    expect(parseYtDlpError('Video unavailable')).toContain('unavailable')
  })

  test('detects 403 errors', () => {
    expect(parseYtDlpError('HTTP Error 403: Forbidden')).toContain('403')
  })

  test('detects network errors', () => {
    expect(
      parseYtDlpError('Unable to download webpage: network error')
    ).toContain('Network error')
  })

  test('returns generic message for unknown errors', () => {
    const msg = parseYtDlpError('some random error')
    expect(msg).toContain('Failed to process')
  })
})
