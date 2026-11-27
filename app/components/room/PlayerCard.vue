<template>
  <section
    class="relative overflow-hidden rounded-2xl border border-default bg-elevated/50"
    aria-label="Now playing"
  >
    <!-- Blurred artwork backdrop -->
    <div
      v-if="image"
      class="pointer-events-none absolute inset-0 scale-125 bg-cover bg-center opacity-20 blur-3xl"
      :style="{ backgroundImage: `url(${JSON.stringify(image)})` }"
      aria-hidden="true"
    />

    <div class="relative flex flex-col gap-5 p-4 sm:p-6">
      <div class="flex items-center gap-4 sm:gap-6">
        <div
          class="size-24 shrink-0 overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-default sm:size-36"
        >
          <img
            v-if="image"
            :src="image"
            alt=""
            class="size-full object-cover"
          />
          <div v-else class="flex size-full items-center justify-center">
            <UIcon name="i-lucide-disc-3" class="size-10 text-dimmed" />
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <div class="flex items-center gap-2 text-xs font-medium text-muted">
            <template v-if="title">
              <template v-if="loading">
                <UIcon
                  name="i-lucide-loader-circle"
                  class="size-3.5 animate-spin text-primary"
                />
                <span role="status">Loading…</span>
              </template>
              <template v-else>
                <span
                  class="size-2 rounded-full"
                  :class="isPlaying ? 'animate-pulse bg-primary' : 'bg-dimmed'"
                />
                <span>{{ isPlaying ? 'Now playing' : 'Paused' }}</span>
              </template>
              <UBadge
                v-if="source"
                :icon="sourceMeta[source].icon"
                :label="sourceMeta[source].label"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </template>
            <span v-else>Nothing playing</span>
          </div>
          <h2
            class="line-clamp-2 text-lg font-semibold leading-snug text-highlighted sm:text-2xl"
            :title="title"
          >
            {{ title || emptyTitle }}
          </h2>
          <p v-if="subtitle" class="truncate text-sm text-muted">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div v-if="title && duration > 0" class="space-y-1">
        <input
          type="range"
          min="0"
          :max="duration"
          step="0.1"
          :value="Math.min(currentTime, duration)"
          :disabled="!controllable"
          class="range w-full"
          :style="{ '--progress': `${progressPct}%` }"
          aria-label="Seek"
          @input="onSeek"
        />
        <div class="flex justify-between text-xs tabular-nums text-muted">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div v-if="controllable" class="flex items-center gap-2">
        <UButton
          :icon="
            loading
              ? 'i-lucide-loader-circle'
              : isPlaying
                ? 'i-lucide-pause'
                : 'i-lucide-play'
          "
          :aria-label="isPlaying || loading ? 'Pause' : 'Play'"
          size="xl"
          class="rounded-full"
          :ui="{ leadingIcon: loading ? 'animate-spin' : '' }"
          :disabled="toggleDisabled"
          @click="$emit('toggle')"
        />
        <UButton
          icon="i-lucide-skip-forward"
          aria-label="Skip"
          color="neutral"
          variant="ghost"
          size="xl"
          class="rounded-full"
          :disabled="!canSkip"
          @click="$emit('skip')"
        />

        <div
          v-if="volume !== undefined"
          class="ml-auto flex items-center gap-2"
        >
          <UButton
            :icon="volume === 0 ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
            :aria-label="volume === 0 ? 'Unmute' : 'Mute'"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="$emit('mute')"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="volume"
            class="range w-20 sm:w-28"
            :style="{ '--progress': `${volume * 100}%` }"
            aria-label="Volume"
            @input="onVolume"
          />
        </div>
      </div>
      <p v-else-if="hint" class="text-sm text-muted">{{ hint }}</p>
    </div>
  </section>
</template>

<script lang="ts" setup>
type Source = 'youtube' | 'spotify' | 'soundcloud'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    image?: string
    source?: Source
    isPlaying?: boolean
    /** Playback is being prepared: spinner instead of play/pause state. */
    loading?: boolean
    /** Seconds. */
    currentTime?: number
    /** Seconds; 0 hides the progress bar. */
    duration?: number
    /** 0..1; undefined hides the volume control. */
    volume?: number
    controllable?: boolean
    canSkip?: boolean
    toggleDisabled?: boolean
    emptyTitle?: string
    /** Shown instead of controls when not controllable. */
    hint?: string
  }>(),
  {
    title: '',
    subtitle: '',
    image: '',
    source: undefined,
    isPlaying: false,
    loading: false,
    currentTime: 0,
    duration: 0,
    volume: undefined,
    controllable: false,
    canSkip: false,
    toggleDisabled: false,
    emptyTitle: 'Add a song to get started',
    hint: ''
  }
)

const emit = defineEmits<{
  toggle: []
  skip: []
  mute: []
  seek: [seconds: number]
  volume: [value: number]
}>()

const sourceMeta: Record<Source, { label: string; icon: string }> = {
  youtube: { label: 'YouTube', icon: 'i-simple-icons-youtube' },
  spotify: { label: 'Spotify', icon: 'i-simple-icons-spotify' },
  soundcloud: { label: 'SoundCloud', icon: 'i-simple-icons-soundcloud' }
}

const progressPct = computed(() =>
  props.duration > 0
    ? Math.min(100, (props.currentTime / props.duration) * 100)
    : 0
)

function onSeek(e: Event) {
  emit('seek', Number((e.target as HTMLInputElement).value))
}

function onVolume(e: Event) {
  emit('volume', Number((e.target as HTMLInputElement).value))
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.range {
  appearance: none;
  height: 0.375rem;
  border-radius: 9999px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    var(--ui-primary) var(--progress, 0%),
    var(--ui-bg-accented) var(--progress, 0%)
  );
}
.range:disabled {
  cursor: default;
}
.range::-webkit-slider-thumb {
  appearance: none;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 9999px;
  background: var(--ui-text-highlighted);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
}
.range::-moz-range-thumb {
  width: 0.875rem;
  height: 0.875rem;
  border: 0;
  border-radius: 9999px;
  background: var(--ui-text-highlighted);
}
.range:disabled::-webkit-slider-thumb {
  visibility: hidden;
}
.range:disabled::-moz-range-thumb {
  visibility: hidden;
}
</style>
