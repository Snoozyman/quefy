<template>
  <div
    v-if="show"
    class="rounded-xl border border-default p-4 space-y-3"
  >
    <div class="flex items-center gap-3">
      <img
        :src="track.album.images[0]?.url"
        alt=""
        class="size-12 rounded-lg object-cover shrink-0"
      >
      <div class="min-w-0">
        <p class="font-medium truncate">
          {{ track.name }}
        </p>
        <p class="text-xs text-muted truncate">
          {{ track.artists.map(a => a.name).join(', ') }}
        </p>
      </div>
    </div>
    <div class="space-y-1">
      <input
        type="range"
        min="0"
        :max="duration"
        :value="position"
        class="w-full accent-primary"
        @input="$emit('seek', Number(($event.target as HTMLInputElement).value))"
      >
      <div class="flex justify-between text-xs text-muted">
        <span>{{ formatTime(position / 1000) }}</span>
        <span>{{ formatTime(duration / 1000) }}</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <UButton
        :icon="paused ? 'i-lucide-play' : 'i-lucide-pause'"
        size="md"
        color="primary"
        variant="solid"
        @click="togglePlay"
      />
      <UIcon
        name="i-simple-icons-spotify"
        class="size-5 text-primary shrink-0"
      />
      <span class="text-xs text-muted">Spotify</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  show: boolean
  track: { name: string, album: { images: Array<{ url: string }> }, artists: Array<{ name: string }> }
  paused: boolean
  position: number
  duration: number
}>()

const emit = defineEmits<{
  play: []
  pause: []
  seek: [value: number]
}>()

function togglePlay() {
  if (props.paused) {
    emit('play')
  } else {
    emit('pause')
  }
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
</script>
