<template>
  <div class="space-y-2">
    <h2 class="font-semibold text-sm text-muted">
      Queue
      <span v-if="queue.length">({{ queue.length }}<template v-if="totalDuration"> · {{ totalDuration }}</template>)</span>
    </h2>
    <div v-if="queue.length === 0" class="text-sm text-muted py-4 text-center">
      Queue is empty. Add a song to get started.
    </div>
    <VueDraggable
      v-model="localQueue"
      handle=".drag-handle"
      ghost-class="opacity-40"
      :animation="200"
      :disabled="!isHost"
      @end="onReorder"
    >
      <div
        v-for="song in localQueue"
        :key="song.id"
        class="flex items-center gap-3 rounded-lg border border-default px-3 py-2"
        :class="{ 'cursor-default': !isHost }"
      >
        <UIcon
          v-if="isHost"
          name="i-lucide-grip-vertical"
          class="drag-handle size-4 shrink-0 text-muted cursor-grab active:cursor-grabbing"
        />
        <UIcon
          :name="sourceIcon(song.source)"
          class="size-4 shrink-0 text-muted"
        />
        <NuxtImg
          v-if="song.albumImageUrl"
          :src="song.albumImageUrl"
          alt=""
          class="size-8 rounded object-cover shrink-0"
        />
        <UIcon v-else name="i-lucide-music" class="size-4 shrink-0 text-muted" />
        <div class="min-w-0 grow">
          <p class="text-sm truncate">
            {{ song.title }}
          </p>
          <p class="text-xs text-muted">
            <template v-if="song.source === 'spotify' && song.artists?.length">
              {{ song.artists.join(', ') }}
            </template>
            <template v-else> added by {{ song.addedBy }} </template>
            <template v-if="song.durationMs"> · {{ formatDurationMs(song.durationMs) }}</template>
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
    </VueDraggable>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { SongData } from '#shared/types/room'
import { formatDurationMs } from '#shared/utils/format'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  queue: SongData[]
  isHost: boolean
}>()

const emit = defineEmits<{
  remove: [songId: string]
  reorder: [songIds: string[]]
}>()

const localQueue = ref<SongData[]>([...props.queue])

watch(
  () => props.queue,
  (val) => {
    localQueue.value = [...val]
  },
  { deep: true }
)

function onReorder() {
  emit('reorder', localQueue.value.map(s => s.id))
}

function sourceIcon(source: string): string {
  if (source === 'spotify') return 'i-simple-icons-spotify'
  if (source === 'soundcloud') return 'i-simple-icons-soundcloud'
  return 'i-simple-icons-youtube'
}

const totalDuration = computed(() => {
  const totalMs = props.queue.reduce((sum, s) => sum + (s.durationMs ?? 0), 0)
  return totalMs > 0 ? formatDurationMs(totalMs) : ''
})
</script>
