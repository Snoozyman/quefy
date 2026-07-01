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
  </div>
</template>

<script lang="ts" setup>
import type { RoomState } from '#shared/types/room'

const props = defineProps<{
  roomId: string
  roomState: RoomState
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
