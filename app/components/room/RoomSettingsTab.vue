<template>
  <div class="space-y-6">
    <section v-if="isHost && hostToken" class="space-y-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
        Playback sources
      </h3>
      <div
        class="flex items-center justify-between gap-4 rounded-lg border border-default p-3"
      >
        <div>
          <p class="text-sm font-medium">Cookies</p>
          <p class="text-xs text-muted">
            Used by yt-dlp for YouTube and SoundCloud.
          </p>
        </div>
        <RoomCookieUpload :room-id="roomId" :host-token="hostToken" />
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
        Queue
      </h3>
      <div class="divide-y divide-default rounded-lg border border-default">
        <div
          v-if="isHost"
          class="flex items-center justify-between gap-4 p-3"
        >
          <div>
            <p class="text-sm font-medium">Import</p>
            <p class="text-xs text-muted">
              From a YouTube playlist or an exported file.
            </p>
          </div>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-upload"
            @click="$emit('import')"
          >
            Import
          </UButton>
        </div>
        <div class="flex items-center justify-between gap-4 p-3">
          <div>
            <p class="text-sm font-medium">Export</p>
            <p class="text-xs text-muted">Download the queue as JSON.</p>
          </div>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            @click="$emit('export')"
          >
            Export
          </UButton>
        </div>
      </div>
    </section>

    <section v-if="isHost" class="space-y-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-error">
        Danger zone
      </h3>
      <div
        class="flex items-center justify-between gap-4 rounded-lg border border-error/30 p-3"
      >
        <div>
          <p class="text-sm font-medium">Delete room</p>
          <p class="text-xs text-muted">
            Ends the room for everyone. This can't be undone.
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <UButton
            v-if="confirmingDelete"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="confirmingDelete = false"
          >
            Cancel
          </UButton>
          <UButton
            size="sm"
            color="error"
            :variant="confirmingDelete ? 'solid' : 'soft'"
            icon="i-lucide-trash-2"
            @click="onDelete"
          >
            {{ confirmingDelete ? 'Delete for everyone' : 'Delete' }}
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  isHost: boolean
  roomId: string
  hostToken?: string
}>()

const emit = defineEmits<{
  import: []
  export: []
  delete: []
}>()

const confirmingDelete = ref(false)

function onDelete() {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    return
  }
  confirmingDelete.value = false
  emit('delete')
}
</script>
