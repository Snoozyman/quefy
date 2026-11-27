/**
 * Spotify's Web Playback SDK plays audio inside its own hidden iframe, so the
 * browser (and OS media widgets such as KDE's or Chrome's media controls)
 * attribute playback to that frame and show "Spotify Embedded Player"
 * instead of our Media Session metadata. Playing a silent, looping audio
 * element in the page itself gives those widgets a player of ours to follow,
 * so the song info set via `navigator.mediaSession` is shown.
 *
 * Widgets read length and position from that element, so the clip is as
 * long as the current track and kept in step with Spotify's position.
 * Chrome ignores media shorter than ~5s for the media session, hence a 10s
 * minimum. Verified with KDE's browser integration (and other widgets that
 * follow the page's own players); Chrome's built-in media controls still
 * prefer the Spotify frame and fall back to the page title, which we also
 * set to the song.
 */

const MIN_SECONDS = 10
/**
 * Low rate keeps a 5-minute clip of silence around 900 KB. 3000 Hz is the
 * lowest rate Chrome decodes; below it the clip fails to load.
 */
const SAMPLE_RATE = 3000
/** Re-seek the anchor when it drifts further than this from Spotify. */
const MAX_DRIFT_S = 2

let audio: HTMLAudioElement | null = null
let objectUrl: string | null = null
let anchorSeconds = 0

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
  /** A widget's seek bar moved the anchor: seek the real player there. */
  onExternalSeek?: (seconds: number) => void
}

let hooks: MediaSessionAnchorHooks = {}
/** Pause/play events we caused ourselves and still expect, to tell them apart. */
let ownEvents = 0
/** Seeks we made ourselves (drift correction), likewise. */
let ownSeeks = 0

export function setMediaSessionAnchorHooks(h: MediaSessionAnchorHooks) {
  hooks = h
}

function toSeconds(durationMs?: number): number {
  return Math.max(MIN_SECONDS, Math.ceil((durationMs ?? 0) / 1000))
}

/** Replace the anchor with one `seconds` long (the old one is discarded). */
function create(seconds: number): HTMLAudioElement {
  discard()
  anchorSeconds = seconds
  objectUrl = URL.createObjectURL(silentWav(seconds))
  const el = new Audio(objectUrl)
  // Looping (not ending) so reaching the end never reads as a user pause.
  el.loop = true
  // Must be in the DOM: KDE's browser integration only sees attached players.
  el.hidden = true
  document.body.appendChild(el)
  el.addEventListener('playing', () => hooks.onPlaying?.())
  el.addEventListener('pause', () => {
    if (ownEvents > 0) ownEvents--
    // A clip that failed to load is not someone pressing pause.
    else if (el === audio && !el.error) hooks.onExternalPause?.()
  })
  el.addEventListener('play', () => {
    if (ownEvents > 0) ownEvents--
    else if (el === audio) hooks.onExternalPlay?.()
  })
  el.addEventListener('seeked', () => {
    if (ownSeeks > 0) ownSeeks--
    else if (el === audio) hooks.onExternalSeek?.(el.currentTime)
  })
  audio = el
  return el
}

function discard() {
  if (!audio) return
  pauseOwn(audio)
  audio.remove()
  audio = null
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = null
}

function pauseOwn(el: HTMLAudioElement) {
  if (el.paused) return
  ownEvents++
  el.pause()
}

function seekOwn(el: HTMLAudioElement, seconds: number) {
  // Before metadata loads, this only sets the start position: no 'seeked'.
  if (el.readyState >= HTMLMediaElement.HAVE_METADATA) ownSeeks++
  el.currentTime = seconds
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
 * Start or stop the anchor. `durationMs` / `positionMs` describe the Spotify
 * track so widgets show its length and progress. `restart` replays it so it
 * is again the most recently started player (widgets follow that one), e.g.
 * after the Spotify frame starts a new track. Failures (autoplay blocked)
 * are harmless.
 */
export function setMediaSessionAnchor(
  active: boolean,
  {
    durationMs,
    positionMs = 0,
    restart = false
  }: { durationMs?: number; positionMs?: number; restart?: boolean } = {}
) {
  if (!import.meta.client) return
  if (!active) {
    if (audio) pauseOwn(audio)
    return
  }
  const seconds = toSeconds(durationMs)
  const el = !audio || seconds !== anchorSeconds ? create(seconds) : audio
  if (restart) pauseOwn(el)
  seekOwn(el, Math.min(positionMs / 1000, seconds - 0.5))
  playOwn(el)
}

/**
 * Keep the anchor's length and position matching Spotify's while active: a
 * new length (next track) replaces it, drift or a seek moves it.
 */
export function syncMediaSessionAnchor(durationMs: number, positionMs: number) {
  if (!audio || audio.paused || durationMs <= 0) return
  const seconds = toSeconds(durationMs)
  if (seconds !== anchorSeconds) {
    setMediaSessionAnchor(true, { durationMs, positionMs })
    return
  }
  const target = Math.min(positionMs / 1000, seconds - 0.5)
  if (Math.abs(audio.currentTime - target) > MAX_DRIFT_S) {
    seekOwn(audio, target)
  }
}

export function destroyMediaSessionAnchor() {
  discard()
  hooks = {}
  ownEvents = 0
  ownSeeks = 0
}
