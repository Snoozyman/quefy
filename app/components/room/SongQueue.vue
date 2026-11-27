<template>
  <section
    class="rounded-2xl border border-default bg-elevated/30"
    aria-label="Queue"
  >
    <header
      class="flex items-baseline justify-between gap-2 border-b border-default px-4 py-3"
    >
      <h2 class="text-sm font-semibold text-highlighted">Up next</h2>
      <span v-if="queue.length" class="text-xs tabular-nums text-muted">
        {{ queue.length }} song{{ queue.length === 1 ? '' : 's' }}
        <template v-if="totalDuration"> · {{ totalDuration }}</template>
      </span>
    </header>

    <div
      v-if="queue.length === 0"
      class="flex flex-col items-center gap-2 px-4 py-10 text-center"
    >
      <UIcon name="i-lucide-list-music" class="size-8 text-dimmed" />
      <p class="text-sm text-muted">The queue is empty.</p>
      <p class="text-xs text-dimmed">Search above to add the first song.</p>
    </div>

    <VueDraggable
      v-else
      v-model="localQueue"
      tag="ol"
      handle=".drag-handle"
      ghost-class="opacity-40"
      :animation="200"
      :disabled="!isHost"
      class="max-h-[70vh] overflow-y-auto p-2"
      @end="onReorder"
    >
      <li
        v-for="(song, i) in localQueue"
        :key="song.id"
        class="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-elevated"
      >
        <span
          class="w-5 shrink-0 text-right text-xs tabular-nums text-dimmed"
          :class="{ 'hidden sm:block sm:group-hover:hidden': isHost }"
        >
          {{ i + 1 }}
        </span>
        <UIcon
          v-if="isHost"
          name="i-lucide-grip-vertical"
          class="drag-handle size-5 shrink-0 cursor-grab text-muted active:cursor-grabbing sm:hidden sm:group-hover:block"
          aria-label="Drag to reorder"
        />
        <div class="relative shrink-0">
          <NuxtImg
            v-if="song.albumImageUrl"
            :src="song.albumImageUrl"
            alt=""
            class="size-10 rounded-md object-cover"
          />
          <div
            v-else
            class="flex size-10 items-center justify-center rounded-md bg-muted"
          >
            <UIcon name="i-lucide-music" class="size-4 text-dimmed" />
          </div>
          <UIcon
            :name="sourceIcon(song.source)"
            class="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-default p-0.5 text-muted"
          />
        </div>
        <div class="min-w-0 grow">
          <p class="truncate text-sm font-medium" :title="song.title">
            {{ song.title }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ songSubtitle(song) }}
          </p>
        </div>
        <span
          v-if="song.durationMs"
          class="shrink-0 text-xs tabular-nums text-muted"
        >
          {{ formatDurationMs(song.durationMs) }}
        </span>
        <UButton
          v-if="isHost"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          :aria-label="`Remove ${song.title}`"
          class="opacity-60 hover:text-error hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          @click="$emit('remove', song.id)"
        />
      </li>
    </VueDraggable>
  </section>
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
