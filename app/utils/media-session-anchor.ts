/**
 * Spotify's Web Playback SDK plays audio inside its own hidden iframe, so the
 * browser (and OS media widgets such as KDE's or Chrome's media controls)
 * attribute playback to that frame and show "Spotify Embedded Player"
 * instead of our Media Session metadata. Playing a silent, looping audio
 * element in the page itself gives those widgets a player of ours to follow,
 * so the song info set via `navigator.mediaSession` is shown.
 *
 * Chrome ignores media shorter than ~5s for the media session, hence a 10s
 * clip rather than a tiny one. Verified with KDE's browser integration (and other
 * widgets that follow the page's own players) pick this up; Chrome's built-in
 * media controls still prefer the Spotify frame and fall back to the page
 * title, which we also set to the song.
 */

const SECONDS = 10
const SAMPLE_RATE = 8000

let audio: HTMLAudioElement | null = null
let objectUrl: string | null = null

/** A mono 8-bit PCM WAV of silence (8-bit PCM silence is 128). */
function silentWav(seconds: number): Blob {
  const dataSize = seconds * SAMPLE_RATE
  const buf = new ArrayBuffer(44 + dataSize)
  const v = new DataView(buf)
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i))
  }
  str(0, 'RIFF')
  v.setUint32(4, 36 + dataSize, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true) // fmt chunk size
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, SAMPLE_RATE, true)
  v.setUint32(28, SAMPLE_RATE, true) // byte rate
  v.setUint16(32, 1, true) // block align
  v.setUint16(34, 8, true) // bits per sample
  str(36, 'data')
  v.setUint32(40, dataSize, true)
  new Uint8Array(buf, 44).fill(128)
  return new Blob([buf], { type: 'audio/wav' })
}

export interface MediaSessionAnchorHooks {
  /** The anchor started playing: re-announce metadata and action handlers. */
  onPlaying?: () => void
  /**
   * Something outside the app (an OS media widget) paused or resumed the
   * anchor directly instead of calling our Media Session handlers.
   */
  onExternalPause?: () => void
  onExternalPlay?: () => void
}

let hooks: MediaSessionAnchorHooks = {}
/** Pause/play events we caused ourselves and still expect, to tell them apart. */
let ownEvents = 0

export function setMediaSessionAnchorHooks(h: MediaSessionAnchorHooks) {
  hooks = h
}

function element(): HTMLAudioElement {
  if (!audio) {
    objectUrl = URL.createObjectURL(silentWav(SECONDS))
    audio = new Audio(objectUrl)
    audio.loop = true
    // Must be in the DOM: KDE's browser integration only sees attached players.
    audio.hidden = true
    document.body.appendChild(audio)
    audio.addEventListener('playing', () => hooks.onPlaying?.())
    audio.addEventListener('pause', () => {
      if (ownEvents > 0) ownEvents--
      else hooks.onExternalPause?.()
    })
    audio.addEventListener('play', () => {
      if (ownEvents > 0) ownEvents--
      else hooks.onExternalPlay?.()
    })
  }
  return audio
}

function pauseOwn(el: HTMLAudioElement) {
  if (el.paused) return
  ownEvents++
  el.pause()
}

function playOwn(el: HTMLAudioElement) {
  if (!el.paused) return
  ownEvents++
  // A play() blocked by autoplay rules rejects without firing 'play'.
  el.play().catch(() => {
    ownEvents = Math.max(0, ownEvents - 1)
  })
}

/**
 * Start or stop the anchor. `restart` replays it so it is again the most
 * recently started player (media widgets follow that one), e.g. after the
 * Spotify frame starts a new track. Failures (autoplay blocked) are harmless.
 */
export function setMediaSessionAnchor(
  active: boolean,
  { restart = false }: { restart?: boolean } = {}
) {
  if (!import.meta.client) return
  if (!active) {
    if (audio) pauseOwn(audio)
    return
  }
  const el = element()
  if (restart) pauseOwn(el)
  playOwn(el)
}

export function destroyMediaSessionAnchor() {
  if (audio) pauseOwn(audio)
  audio?.remove()
  audio = null
  hooks = {}
  ownEvents = 0
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = null
}
