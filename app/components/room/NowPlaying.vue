<template>
  <div
    v-if="song"
    class="rounded-xl border border-default p-4 flex items-center gap-3"
  >
    <img
      v-if="song.albumImageUrl"
      :src="song.albumImageUrl"
      alt=""
      class="size-12 rounded-lg object-cover shrink-0"
    >
    <div
      v-else
      class="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center"
    >
      <UIcon
        name="i-lucide-music"
        class="size-6 text-muted"
      />
    </div>
    <div class="min-w-0">
      <p class="text-xs text-muted mb-0.5">
        Now Playing
      </p>
      <p class="font-medium truncate">
        {{ song.title }}
      </p>
      <p
        v-if="song.artists?.length"
        class="text-xs text-muted truncate"
      >
        {{ song.artists.join(', ') }}
      </p>
      <p
        v-if="song.source === 'spotify'"
        class="text-xs text-primary mt-0.5"
      >
        Spotify
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SongData } from '#shared/types/room'

defineProps<{
  song: SongData | null
}>()
</script>
