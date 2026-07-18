<template>
  <UModal v-model:open="open" title="Import Queue">
    <template #body>
      <UTabs :items="tabs" variant="link">
        <template #youtube="{ item }">
          <div class="flex flex-col gap-3 pt-3">
            <UInput
              v-model="playlistUrl"
              placeholder="https://www.youtube.com/playlist?list=..."
              :disabled="importing"
              @keydown.enter="importYoutube"
            />
            <UButton
              label="Import Playlist"
              icon="i-lucide-download"
              :loading="importing"
              :disabled="!playlistUrl.trim() || importing"
              @click="importYoutube"
            />
          </div>
        </template>
        <template #file="{ item }">
          <div class="flex flex-col gap-3 pt-3">
            <UInput
              type="file"
              accept=".json"
              :disabled="importing"
              @change="onFileChange"
            />
            <UButton
              label="Import File"
              icon="i-lucide-download"
              :loading="importing"
              :disabled="!selectedFile || importing"
              @click="importFile"
            />
          </div>
        </template>
      </UTabs>
      <UAlert
        v-if="resultMessage"
        :color="resultSuccess ? 'success' : 'error'"
        :description="resultMessage"
        class="mt-3"
      />
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { SongData } from '#shared/types/room'

const props = defineProps<{
  roomId: string
  hostToken: string
}>()

const emit = defineEmits<{
  imported: []
}>()

const open = defineModel<boolean>('open', { default: false })

const playlistUrl = ref('')
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const resultMessage = ref('')
const resultSuccess = ref(false)

const tabs = [
  { label: 'YouTube Playlist', slot: 'youtube' },
  { label: 'Queue File', slot: 'file' }
]

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function importYoutube() {
  if (!playlistUrl.value.trim() || importing.value) return
  importing.value = true
  resultMessage.value = ''
  try {
    const res = await $fetch<{ count: number }>(
      `/api/room/${props.roomId}/queue-import/youtube`,
      {
        method: 'POST',
        body: {
          hostToken: props.hostToken,
          playlistUrl: playlistUrl.value.trim()
        }
      }
    )
    resultSuccess.value = true
    resultMessage.value = `Imported ${res.count} song${res.count === 1 ? '' : 's'}.`
    playlistUrl.value = ''
    emit('imported')
  } catch (err: any) {
    resultSuccess.value = false
    resultMessage.value =
      err?.data?.statusMessage || 'Failed to import playlist.'
  } finally {
    importing.value = false
  }
}

async function importFile() {
  if (!selectedFile.value || importing.value) return
  importing.value = true
  resultMessage.value = ''
  try {
    const text = await selectedFile.value.text()
    const data = JSON.parse(text)
    const songs: SongData[] = data.queue ?? (Array.isArray(data) ? data : [])
    if (!songs.length) {
      resultSuccess.value = false
      resultMessage.value = 'No songs found in file.'
      return
    }
    const res = await $fetch<{ count: number }>(
      `/api/room/${props.roomId}/queue-import`,
      {
        method: 'POST',
        body: { hostToken: props.hostToken, songs }
      }
    )
    resultSuccess.value = true
    resultMessage.value = `Imported ${res.count} song${res.count === 1 ? '' : 's'}.`
    selectedFile.value = null
    emit('imported')
  } catch (err: any) {
    resultSuccess.value = false
    resultMessage.value = err?.data?.statusMessage || 'Failed to import file.'
  } finally {
    importing.value = false
  }
}
</script>
