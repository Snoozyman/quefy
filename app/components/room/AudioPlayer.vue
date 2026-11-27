<template>
  <div v-if="show">
    <RoomPlayerCard
      :title="currentSong?.title"
      :subtitle="songSubtitle(currentSong)"
      :image="currentSong?.albumImageUrl"
      :source="currentSong?.source"
      :is-playing="playing"
      :current-time="currentTime"
      :duration="duration || (currentSong?.durationMs ?? 0) / 1000"
      :volume="volume"
      :can-skip="!!currentSong"
      controllable
      @toggle="$emit('toggle')"
      @skip="$emit('skip')"
      @seek="seek"
      @volume="setVolume"
      @mute="toggleMute"
    />
    <audio
      ref="audioEl"
      hidden
      playsinline
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @error="onError"
      @webkitbeginnerinterruption="onInterruption"
    />
  </div>
</template>

<script lang="ts" setup>
import Hls from 'hls.js'
import type { SongData } from '#shared/types/room'

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

const props = defineProps<{
  show: boolean
  currentSong: SongData | null
  isPlaying: boolean
}>()

const emit = defineEmits<{
  toggle: []
  skip: []
  ended: []
  error: [message: string]
  expired: []
  'play-blocked': []
}>()

const audioEl = ref<HTMLAudioElement | undefined>()
const hls = ref<Hls | null>(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.33)
const seekValue = ref(0)
const lastUrl = ref('')
let errorEmitted = false
const silentAudio = ref<HTMLAudioElement | undefined>()
let silentAudioUnlocked = false

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function unlockSilentAudio() {
  if (silentAudioUnlocked) return
  silentAudioUnlocked = true
  if (!isIOS()) return
  const el = new Audio(SILENT_WAV)
  el.loop = true
  el.volume = 0
  el.setAttribute('playsinline', '')
  document.body.appendChild(el)
  silentAudio.value = el
  el.play().then(() => {
    el.pause()
  }).catch(() => {})
}

function toggleSilentAudio(active: boolean) {
  const el = silentAudio.value
  if (!el) return
  if (active) {
    el.loop = true
    el.play().catch(() => {})
  } else {
    el.pause()
  }
}

function destroyHls() {
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }
  errorEmitted = false
}

// A new song may arrive while paused (e.g. skip): don't keep showing the
// previous track's position and length until it is actually loaded.
watch(
  () => props.currentSong?.id,
  (id, prev) => {
    if (id === prev || lastLoadedSongId === id) return
    currentTime.value = 0
    duration.value = 0
    seekValue.value = 0
  }
)
let lastLoadedSongId: string | undefined

function play(url: string, startTime?: number) {
  lastLoadedSongId = props.currentSong?.id
  if (!audioEl.value) return
  lastUrl.value = url
  destroyHls()
  currentTime.value = 0
  duration.value = 0
  seekValue.value = 0
  errorEmitted = false

  if (url.includes('m3u8')) {
    if (Hls.isSupported()) {
      const instance = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      })
      instance.loadSource(url)
      instance.attachMedia(audioEl.value)
      instance.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime) {
          audioEl.value!.currentTime = startTime
        }
        playing.value = true
        audioEl.value?.play()
          .then(() => { toggleSilentAudio(true) })
          .catch((err: unknown) => {
            const name = err instanceof DOMException ? err.name : ''
            if (name === 'NotAllowedError') {
              playing.value = false
              emit('play-blocked')
              return
            }
            playing.value = false
            emit('error', 'Playback blocked. Try clicking play again.')
          })
      })
      instance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          errorEmitted = true
          destroyHls()
          playing.value = false
          if (data.response?.code === 403) {
            emit('expired')
          } else {
            emit('error', 'HLS playback failed.')
          }
        }
      })
      hls.value = instance
    } else if (audioEl.value.canPlayType('application/vnd.apple.mpegurl')) {
      audioEl.value.src = url
      audioEl.value.load()
      if (startTime) {
        audioEl.value.currentTime = startTime
      }
      playing.value = true
      audioEl.value.play()
        .then(() => { toggleSilentAudio(true) })
        .catch((err: unknown) => {
          const name = err instanceof DOMException ? err.name : ''
          if (name === 'NotAllowedError') {
            playing.value = false
            emit('play-blocked')
            return
          }
          playing.value = false
          emit('error', 'Playback blocked. Try clicking play again.')
        })
    } else {
      playing.value = false
      emit('error', 'HLS audio is not supported in this browser.')
      return
    }
    return
  }

  audioEl.value.src = url
  audioEl.value.load()
  if (startTime) {
    audioEl.value.currentTime = startTime
  }
  playing.value = true
  audioEl.value.play()
    .then(() => { toggleSilentAudio(true) })
    .catch((err: unknown) => {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError') {
      playing.value = false
      emit('play-blocked')
      return
    }
    playing.value = false
    emit('error', 'Playback blocked. Try clicking play again.')
  })
}

function pause() {
  audioEl.value?.pause()
  playing.value = false
  toggleSilentAudio(false)
}


function resume() {
  const el = audioEl.value
  if (!el) return

  el.play()
    .then(() => {
      playing.value = true
      toggleSilentAudio(true)
    })
    .catch(() => {
      if (!isIOS() || !lastUrl.value || !el) return

      const savedTime = el.currentTime
      destroyHls()
      currentTime.value = savedTime
      duration.value = 0
      seekValue.value = 0
      errorEmitted = false

      if (lastUrl.value.includes('m3u8')) {
        if (Hls.isSupported()) {
          const instance = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60
          })
          instance.loadSource(lastUrl.value)
          instance.attachMedia(el)
          instance.on(Hls.Events.MANIFEST_PARSED, () => {
            el.currentTime = savedTime
            el.play()
              .then(() => { playing.value = true; toggleSilentAudio(true) })
              .catch(() => {})
          })
          instance.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              errorEmitted = true
              destroyHls()
              playing.value = false
            }
          })
          hls.value = instance
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = lastUrl.value
          el.load()
          el.currentTime = savedTime
          el.play()
            .then(() => { playing.value = true; toggleSilentAudio(true) })
            .catch(() => {})
        }
      } else {
        el.src = ''
        el.load()
        el.src = lastUrl.value
        el.load()
        el.currentTime = savedTime
        el.play()
          .then(() => { playing.value = true; toggleSilentAudio(true) })
          .catch(() => {})
      }
    })
}

function onInterruption() {
  playing.value = false
}


function onTimeUpdate() {
  if (!audioEl.value) return
  currentTime.value = audioEl.value.currentTime
  if (duration.value) {
    seekValue.value = (audioEl.value.currentTime / duration.value) * 1000
  }
}

function onLoadedMetadata() {
  if (!audioEl.value) return
  const d = audioEl.value.duration
  if (!d || !isFinite(d)) {
    playing.value = false
    emit('expired')
    return
  }
  duration.value = d
}


function setVolume(v: number) {
  volume.value = v
  if (audioEl.value) audioEl.value.volume = volume.value
}

function toggleMute() {
  volume.value = volume.value === 0 ? 1 : 0
  if (audioEl.value) audioEl.value.volume = volume.value
}

function onEnded() {
  destroyHls()
  playing.value = false
  toggleSilentAudio(false)
  emit('ended')
}

function onError() {
  if (errorEmitted) return
  destroyHls()
  playing.value = false
  errorEmitted = true
  const msg = audioEl.value?.error?.message
  emit('error', msg || 'Audio playback failed.')
}

function seek(time: number) {
  if (!audioEl.value || !duration.value) return
  audioEl.value.currentTime = time
  currentTime.value = time
  seekValue.value = (time / duration.value) * 1000
}

defineExpose({
  play,
  pause,
  resume,
  seek,
  unlockSilentAudio,
  state: { playing, currentTime, duration, volume, seekValue }
})

onUnmounted(() => {
  destroyHls()
  toggleSilentAudio(false)
  silentAudio.value?.remove()
  silentAudio.value = undefined
})
</script>
