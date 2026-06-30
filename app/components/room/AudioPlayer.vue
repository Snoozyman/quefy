<template>
  <div
    v-if="show"
    class="rounded-xl border border-default p-4 space-y-3"
  >
    <div class="flex items-center gap-3">
      <div class="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center">
        <UIcon
          name="i-lucide-music"
          class="size-6 text-muted"
        />
      </div>
      <div class="min-w-0">
        <p
          v-if="currentSong"
          class="font-medium truncate"
        >
          {{ currentSong.title }}
        </p>
        <p
          v-else
          class="text-muted text-sm"
        >
          Nothing playing
        </p>
        <p class="text-xs text-muted">
          {{ currentSong ? (isPlaying ? 'Playing' : 'Paused') : 'Idle' }}
        </p>
      </div>
    </div>
    <div
      v-if="currentSong"
      class="space-y-1"
    >
      <input
        type="range"
        min="0"
        max="1000"
        :value="seekValue"
        class="w-full accent-primary"
        @input="onSeek"
      >
      <div class="flex justify-between text-xs text-muted">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
    </div>
    <div
      v-if="currentSong"
      class="flex items-center gap-3"
    >
      <UButton
        :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
        size="md"
        color="primary"
        variant="solid"
        @click="togglePlay"
      />
      <UIcon
        :name="volume === 0 ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
        class="size-5 text-muted shrink-0 cursor-pointer"
        @click="toggleMute"
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="volume"
        class="w-20 accent-primary"
        @input="onVolumeChange"
      >
    </div>
    <audio
      ref="audioEl"
      hidden
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @error="onError"
    />
  </div>
</template>

<script lang="ts" setup>
import Hls from 'hls.js'
import type { SongData } from '#shared/types/room'

const props = defineProps<{
  show: boolean
  currentSong: SongData | null
  isPlaying: boolean
}>()

const emit = defineEmits<{
  ended: []
  error: [message: string]
}>()

const audioEl = ref<HTMLAudioElement | undefined>()
const hls = ref<Hls | null>(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.33)
const seekValue = ref(0)

function destroyHls() {
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }
}

function play(url: string) {
  if (!audioEl.value) return
  destroyHls()

  if (url.includes('m3u8')) {
    if (Hls.isSupported()) {
      const instance = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      })
      instance.loadSource(url)
      instance.attachMedia(audioEl.value)
      instance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          destroyHls()
          playing.value = false
          emit('error', 'HLS playback failed.')
        }
      })
      hls.value = instance
    } else if (audioEl.value.canPlayType('application/vnd.apple.mpegurl')) {
      audioEl.value.src = url
    }
  } else {
    audioEl.value.src = url
    audioEl.value.load()
  }

  playing.value = true
  audioEl.value.play().catch((err: unknown) => {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError') return
    playing.value = false
    emit('error', 'Playback blocked. Try clicking play again.')
  })
}

function pause() {
  destroyHls()
  audioEl.value?.pause()
  playing.value = false
}

function togglePlay() {
  if (audioEl.value?.paused) {
    audioEl.value.play()
    playing.value = true
  } else {
    audioEl.value?.pause()
    playing.value = false
  }
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
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
    emit('error', 'Song has no duration (live or unavailable). Skipping.')
    return
  }
  duration.value = d
}

function onSeek(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  seekValue.value = val
  if (audioEl.value && duration.value) {
    audioEl.value.currentTime = (val / 1000) * duration.value
  }
}

function onVolumeChange(e: Event) {
  volume.value = Number((e.target as HTMLInputElement).value)
  if (audioEl.value) audioEl.value.volume = volume.value
}

function toggleMute() {
  volume.value = volume.value === 0 ? 1 : 0
  if (audioEl.value) audioEl.value.volume = volume.value
}

function onEnded() {
  destroyHls()
  playing.value = false
  emit('ended')
}

function onError() {
  destroyHls()
  playing.value = false
  const msg = audioEl.value?.error?.message
  emit('error', msg || 'Audio playback failed.')
}

defineExpose({ play, pause, state: { playing, currentTime, duration, volume, seekValue } })

onUnmounted(() => {
  destroyHls()
})
</script>
