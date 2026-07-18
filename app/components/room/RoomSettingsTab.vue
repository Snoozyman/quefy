<template>
  <div class="flex flex-col gap-3">
    <div v-if="isHost" class="flex items-center justify-between">
      <span class="text-sm">Cookies</span>
      <RoomCookieUpload />
    </div>
    <div v-if="isHost" class="flex items-center justify-between">
      <span class="text-sm">Import queue</span>
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-upload"
        @click="$emit('import')"
      >
        Import
      </UButton>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm">Export queue</span>
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-download"
        @click="$emit('export')"
      >
        Export
      </UButton>
    </div>
    <div v-if="isHost" class="flex items-center justify-between">
      <span class="text-sm text-red-500">Delete room</span>
      <UButton
        size="sm"
        color="warning"
        icon="i-lucide-trash"
        @click="$emit('delete')"
      >
        Delete
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  isHost: boolean
}>()

defineEmits<{
  import: []
  export: []
  delete: []
}>()
</script>
