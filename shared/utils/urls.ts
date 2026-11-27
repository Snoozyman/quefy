const SOUNDCLOUD_HOSTS = new Set([
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
  'on.soundcloud.com'
])

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
])

function parseHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

/** True if `input` is an http(s) URL on a SoundCloud host. */
export function isSoundcloudUrl(input: string): boolean {
  const url = parseHttpUrl(input)
  return !!url && SOUNDCLOUD_HOSTS.has(url.hostname.toLowerCase())
}

/** True if `input` is an http(s) YouTube URL carrying a `list=` playlist id. */
export function isYoutubePlaylistUrl(input: string): boolean {
  const url = parseHttpUrl(input)
  return (
    !!url &&
    YOUTUBE_HOSTS.has(url.hostname.toLowerCase()) &&
    !!url.searchParams.get('list')
  )
}

/** YouTube video ids are 11 chars of [A-Za-z0-9_-]. */
export function isYoutubeVideoId(input: string): boolean {
  return /^[\w-]{11}$/.test(input)
}
