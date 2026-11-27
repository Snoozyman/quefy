<template>
  <section class="search-container relative space-y-3" aria-label="Add songs">
    <div
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <h2 class="text-sm font-semibold text-highlighted">Add songs</h2>
      <UTabs
        v-model="mode"
        :items="sourceTabs"
        :content="false"
        size="xs"
        color="neutral"
        :ui="{ trigger: 'px-2.5' }"
      />
    </div>
    <UInput
      v-model="query"
      size="lg"
      icon="i-lucide-search"
      :placeholder="placeholder"
      class="w-full"
      :loading="searching || addingSong"
      @input="onInput"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrev"
      @keydown.enter="addHighlighted"
    />
    <div
      v-if="showResults && results.length"
      class="absolute z-20 mt-1 w-full rounded-xl border border-default bg-default p-1 shadow-xl max-h-80 overflow-y-auto"
    >
      <button
        v-for="(r, i) in results"
        :key="r.id"
        class="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-left hover:bg-elevated transition-colors"
        :class="{ 'bg-elevated': i === highlightIdx }"
        @click="selectResult(r)"
      >
        <img
          :src="r.thumbnail"
          alt=""
          class="size-11 rounded-md object-cover shrink-0"
        />
        <div class="min-w-0 grow">
          <p class="text-sm truncate">
            {{ r.title }}
          </p>
          <p class="text-xs text-muted truncate">
            <template v-if="r.source === 'youtube'">{{ r.channel }}</template>
            <template v-else>{{ r.artists?.join(', ') }}<template v-if="r.albumName"> · {{ r.albumName }}</template></template>
            <template v-if="r.durationString"> · {{ r.durationString }}</template>
          </p>
        </div>
        <UIcon
          :name="
            r.source === 'spotify'
              ? 'i-simple-icons-spotify'
              : r.source === 'soundcloud'
                ? 'i-simple-icons-soundcloud'
                : 'i-simple-icons-youtube'
          "
          class="size-4 shrink-0 text-muted"
        />
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { SearchResult } from '#shared/types/room'

const props = defineProps<{
  roomId: string
  addingSong: boolean
  spotifyConnected: boolean
}>()

const emit = defineEmits<{
  'add-youtube': [data: { videoId: string; title?: string; durationMs?: number; albumImageUrl?: string }]
  'add-spotify': [
    track: {
      trackUri: string
      title: string
      artists?: string[]
      albumName?: string
      albumImageUrl?: string
      durationMs?: number
    }
  ]
  'add-soundcloud': [trackUrl: string]
}>()

const mode = ref<'youtube' | 'spotify' | 'soundcloud'>('youtube')

const sourceTabs = computed(() => [
  { label: 'YouTube', value: 'youtube', icon: 'i-simple-icons-youtube' },
  {
    label: 'Spotify',
    value: 'spotify',
    icon: 'i-simple-icons-spotify',
    disabled: !props.spotifyConnected
  },
  {
    label: 'SoundCloud',
    value: 'soundcloud',
    icon: 'i-simple-icons-soundcloud'
  }
])

const placeholder = computed(() =>
  mode.value === 'youtube'
    ? 'Search YouTube or paste a link'
    : mode.value === 'spotify'
      ? 'Search Spotify tracks'
      : 'Search SoundCloud or paste a link'
)
const query = ref('')
const results = ref<SearchResult[]>([])
const searching = ref(false)
const showResults = ref(false)
const highlightIdx = ref(-1)

let searchTimer: ReturnType<typeof setTimeout>

function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/
  )
  return match ? (match[1] ?? null) : null
}

function extractSoundcloudUrl(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(/(https?:\/\/soundcloud\.com\/[^\s]+)/i)
  return match ? match[1]! : null
}

function onInput() {
  const q = query.value.trim()

  if (mode.value === 'youtube' && extractVideoId(q)) {
    showResults.value = false
    results.value = []
    return
  }

  if (mode.value === 'soundcloud' && extractSoundcloudUrl(q)) {
    showResults.value = false
    results.value = []
    return
  }

  showResults.value = true
  clearTimeout(searchTimer)
  if (q.length < 2) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
    const endpoint =
      mode.value === 'youtube'
        ? `/api/youtube/search?q=${encodeURIComponent(q)}&limit=8`
        : mode.value === 'spotify'
          ? `/api/spotify/search?q=${encodeURIComponent(q)}&limit=8`
          : `/api/soundcloud/search?q=${encodeURIComponent(q)}&limit=8`
    try {
      results.value = await $fetch<SearchResult[]>(endpoint)
      highlightIdx.value = -1
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

function highlightNext() {
  if (!results.value.length) return
  highlightIdx.value = (highlightIdx.value + 1) % results.value.length
}

function highlightPrev() {
  if (!results.value.length) return
  highlightIdx.value =
    (highlightIdx.value - 1 + results.value.length) % results.value.length
}

function addHighlighted() {
  const q = query.value.trim()
  if (!q) return

  if (mode.value === 'youtube') {
    const videoId = extractVideoId(q)
    if (videoId) {
      emit('add-youtube', { videoId })
      reset()
      return
    }
  }

  if (mode.value === 'soundcloud') {
    const trackUrl = extractSoundcloudUrl(q)
    if (trackUrl) {
      emit('add-soundcloud', trackUrl)
      reset()
      return
    }
  }

  const idx = highlightIdx.value
  const r =
    idx >= 0 && idx < results.value.length
      ? results.value[idx]
      : results.value[0]
  if (r) selectResult(r)
}

function selectResult(r: SearchResult) {
  showResults.value = false
  if (r.source === 'spotify') {
    emit('add-spotify', {
      trackUri: r.uri ?? '',
      title: r.title,
      artists: r.artists,
      albumName: r.albumName,
      albumImageUrl: r.thumbnail,
      durationMs: r.durationMs
    })
  } else if (r.source === 'soundcloud') {
    emit('add-soundcloud', r.id)
  } else {
    emit('add-youtube', {
      videoId: r.id,
      title: r.title,
      durationMs: r.duration ? Math.round(r.duration * 1000) : r.durationMs,
      albumImageUrl: r.thumbnail
    })
  }
  reset()
}

function reset() {
  query.value = ''
  results.value = []
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.search-container')) {
    showResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  clearTimeout(searchTimer)
  document.removeEventListener('click', onClickOutside)
})
</script>
