<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0 space-y-2">
      <NuxtLink
        to="/app/overview"
        class="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-default"
      >
        <UIcon name="i-lucide-arrow-left" class="size-3.5" />
        All rooms
      </NuxtLink>
      <h1
        class="truncate text-2xl font-bold tracking-tight text-highlighted sm:text-3xl"
      >
        {{ roomState.title || 'Room' }}
      </h1>
      <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
        <UBadge
          :label="isHost ? 'Host' : 'Guest'"
          :icon="isHost ? 'i-lucide-crown' : 'i-lucide-user'"
          :color="isHost ? 'primary' : 'neutral'"
          variant="subtle"
        />
        <span>{{ listenerSummary }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <UTooltip :text="copied === 'code' ? 'Copied!' : 'Copy room code'">
        <UButton
          color="neutral"
          variant="outline"
          class="font-mono tracking-widest"
          trailing-icon="i-lucide-copy"
          :aria-label="`Room code ${roomId}, copy`"
          @click="copy('code', roomId)"
        >
          {{ roomId }}
        </UButton>
      </UTooltip>
      <UTooltip :text="copied === 'link' ? 'Link copied!' : 'Copy invite link'">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-share-2"
          aria-label="Copy invite link"
          @click="copy('link', inviteUrl)"
        />
      </UTooltip>
      <UTooltip text="Room settings">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-settings"
          aria-label="Room settings"
          @click="$emit('settings')"
        />
      </UTooltip>
    </div>
  </header>
</template>

<script lang="ts" setup>
import type { RoomState } from '#shared/types/room'
import { formatDurationMs } from '#shared/utils/format'

const props = defineProps<{
  roomId: string
  roomState: RoomState
  isHost: boolean
}>()

defineEmits<{ settings: [] }>()

const copied = ref<'code' | 'link' | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const inviteUrl = computed(() =>
  import.meta.client
    ? `${window.location.origin}/app/room/${props.roomId}`
    : ''
)

const listenerSummary = computed(() => {
  const n = props.roomState.queue.length
  const total = props.roomState.queue.reduce(
    (sum, s) => sum + (s.durationMs ?? 0),
    0
  )
  const songs = `${n} song${n === 1 ? '' : 's'} queued`
  return total ? `${songs} · ${formatDurationMs(total)}` : songs
})

async function copy(kind: 'code' | 'link', text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = kind
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = null), 2000)
  } catch {
    // clipboard blocked (e.g. insecure context); the code is visible anyway
  }
}
</script>
