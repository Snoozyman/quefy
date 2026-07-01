<template>
  <div class="flex flex-col justify-between">
    <div class="flex-1 space-y-1 mb-2">
      <h1 class="text-2xl font-bold">
        {{ roomState.title || 'Room' }}
      </h1>
      <p class="text-sm text-muted">
        <NuxtLink
          to="/app/room"
          class="hover:underline"
        >Rooms</NuxtLink>
        · Code:
        <code
          class="font-mono font-bold text-primary cursor-pointer select-all"
          @click="copyRoomCode"
        >{{ roomId }}</code>
        <span
          v-if="copied"
          class="ml-2 text-xs text-muted"
        >Copied!</span>
      </p>
    </div>
    <div class="flex flex-row items-center gap-2 flex-wrap">
      <UButton
        v-if="isHost"
        size="sm"
        variant="outline"
        :icon="roomState.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        :disabled="playDisabled"
        @click="$emit('play')"
      >
        {{ roomState.isPlaying ? 'Pause' : 'Play' }}
      </UButton>
      <UButton
        v-if="isHost"
        size="sm"
        variant="outline"
        icon="i-lucide-skip-forward"
        :disabled="!roomState.currentSong"
        @click="$emit('skip')"
      >
        Skip
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RoomState } from '#shared/types/room'

const props = defineProps<{
  roomId: string
  roomState: RoomState
  isHost: boolean
  playDisabled: boolean
}>()

defineEmits<{
  play: []
  skip: []
}>()

const copied = ref(false)

function copyRoomCode() {
  navigator.clipboard.writeText(props.roomId)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
