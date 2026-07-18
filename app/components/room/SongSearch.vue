<template>
  <div class="search-container relative">
    <div class="flex gap-2 flex-col">
      <div class="flex grow gap-2 items-center">
        <div class="grid grid-cols-3 gap-2 w-full">
          <UButton
            :color="mode === 'youtube' ? 'primary' : 'neutral'"
            variant="solid"
            icon="i-simple-icons-youtube"
            @click="mode = 'youtube'"
            class="text-xs"
          >
            YouTube
          </UButton>
          <UButton
            :color="mode === 'spotify' ? 'primary' : 'neutral'"
            variant="solid"
            icon="i-simple-icons-spotify"
            :disabled="!spotifyConnected"
            :title="spotifyConnected ? '' : 'Host must connect Spotify first'"
            @click="mode = 'spotify'"
            class="text-xs"
          >
            Spotify
          </UButton>
          <UButton
            :color="mode === 'soundcloud' ? 'primary' : 'neutral'"
            variant="solid"
            icon="i-simple-icons-soundcloud"
            @click="mode = 'soundcloud'"
            class="text-xs"
          >
            SC
          </UButton>
        </div>
        <!-- <UButton
          :loading="addingSong"
          :disabled="!query.trim()"
          class="shrink-0 justify-end"
          @click="addHighlighted"
        >
          Add to Queue
        </UButton>
      --></div>
      <UInput
        v-model="query"
        variant="subtle"
        :placeholder="
          mode === 'youtube'
            ? 'Search YouTube or paste a URL'
            : mode === 'spotify'
              ? 'Search Spotify tracks...'
              : 'Search SoundCloud or paste a URL'
        "
        class="grow"
        :loading="searching"
        @input="onInput"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter="addHighlighted"
      />
    </div>
    <div
      v-if="showResults && results.length"
      class="absolute z-10 mt-1 w-full rounded-xl border border-default bg-default shadow-lg max-h-72 overflow-y-auto"
    >
      <button
        v-for="(r, i) in results"
        :key="r.id"
        class="flex items-center gap-3 w-full px-3 py-2 text-left bg-default hover:bg-muted/50 transition-colors"
        :class="{ 'bg-muted/50': i === highlightIdx }"
        @click="selectResult(r)"
      >
        <img
          :src="r.thumbnail"
          alt=""
          class="size-10 rounded object-cover shrink-0"
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
  </div>
</template>

<script lang="ts" setup>
import type { SearchResult } from '#shared/types/room'

const props = defineProps<{
  roomId: string
  addingSong: boolean
  spotifyConnected: boolean
}>()

const emit = defineEmits<{
  'add-youtube': [videoId: string]
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
      emit('add-youtube', videoId)
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
    emit('add-youtube', r.id)
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
