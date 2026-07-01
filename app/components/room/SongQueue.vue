<template>
  <div class="space-y-2">
    <h2 class="font-semibold text-sm text-muted">
      Queue
      <span v-if="queue.length">({{ queue.length }})</span>
    </h2>
    <div
      v-if="queue.length === 0"
      class="text-sm text-muted py-4 text-center"
    >
      Queue is empty. Add a song to get started.
    </div>
    <div
      v-for="song in queue"
      :key="song.id"
      class="flex items-center gap-3 rounded-lg border border-default px-3 py-2"
    >
      <img
        v-if="song.albumImageUrl"
        :src="song.albumImageUrl"
        alt=""
        class="size-8 rounded object-cover shrink-0"
      >
      <UIcon
        v-else
        name="i-lucide-music"
        class="size-4 shrink-0 text-muted"
      />
      <div class="min-w-0 grow">
        <p class="text-sm truncate">
          {{ song.title }}
        </p>
        <p class="text-xs text-muted">
          <template v-if="song.source === 'spotify' && song.artists?.length">
            {{ song.artists.join(', ') }}
          </template>
          <template v-else>
            added by {{ song.addedBy }}
          </template>
          <span class="ml-1">
            <UIcon
              :name="sourceIcon(song.source)"
              class="size-3 inline"
            />
          </span>
        </p>
      </div>
      <UButton
        v-if="isHost"
        size="xs"
        color="error"
        variant="ghost"
        icon="i-lucide-x"
        @click="$emit('remove', song.id)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SongData } from '#shared/types/room'

defineProps<{
  queue: SongData[]
  isHost: boolean
}>()

defineEmits<{
  remove: [songId: string]
}>()

function sourceIcon(source: string): string {
  if (source === 'spotify') return 'i-simple-icons-spotify'
  if (source === 'soundcloud') return 'i-simple-icons-soundcloud'
  return 'i-simple-icons-youtube'
}
</script>
