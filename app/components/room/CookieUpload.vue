<template>
  <div>
    <UButton
      size="sm"
      variant="outline"
      icon="i-lucide-cookie"
      @click="open = true"
    >
      {{ statusText }}
    </UButton>

    <UModal v-model:open="open">
      <template #content>
        <div class="p-4 space-y-4">
          <h2 class="text-lg font-semibold">
            YouTube Cookies
            <span
              v-if="cookieExists"
              class="text-sm text-muted font-normal"
            >
              ({{ cookieSize }} bytes)
            </span>
            <span
              v-else
              class="text-sm text-muted font-normal"
            >
              (not set)
            </span>
          </h2>

          <p class="text-sm text-muted">
            Export cookies from your browser as a Netscape-format <code>cookies.txt</code> file
            (use "Get cookies.txt" extension), then upload or paste them here.
            This helps yt-dlp access age-restricted or private videos.
          </p>

          <div class="flex items-center gap-2">
            <UButton
              size="sm"
              variant="outline"
              @click="triggerFilePick"
            >
              Choose File
            </UButton>
            <input
              ref="fileInput"
              type="file"
              accept=".txt"
              class="hidden"
              @change="onFilePicked"
            >
            <span
              v-if="fileName"
              class="text-xs text-muted truncate"
            >{{ fileName }}</span>
          </div>

          <textarea
            v-model="pasteText"
            placeholder="Or paste cookie contents here..."
            class="w-full h-32 rounded-lg border border-default bg-muted/30 p-2 text-xs font-mono resize-none"
          />

          <div
            v-if="saveMsg"
            class="flex items-center gap-2 text-sm"
            :class="saveOk ? 'text-green-600' : 'text-red-500'"
          >
            <UIcon
              v-if="saveOk"
              name="i-lucide-check-circle"
              class="size-4"
            />
            <UIcon
              v-else
              name="i-lucide-alert-circle"
              class="size-4"
            />
            <span>{{ saveMsg }}</span>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              size="sm"
              color="primary"
              :disabled="!pasteText.trim()"
              :loading="saving"
              @click="save"
            >
              Save Cookies
            </UButton>
            <UButton
              v-if="cookieExists"
              size="sm"
              variant="outline"
              color="error"
              :loading="deleting"
              @click="deleteCookies"
            >
              Remove
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
interface CookieSaveResponse {
  ok: boolean
  size: number
  verified?: boolean
  verifyError?: string
}

const open = ref(false)
const cookieExists = ref(false)
const cookieSize = ref(0)
const fileInput = ref<HTMLInputElement | undefined>()
const fileName = ref('')
const pasteText = ref('')
const saving = ref(false)
const deleting = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)

const statusText = computed(() => {
  if (cookieExists.value) return `Cookies (${cookieSize.value}b)`
  return 'Cookies'
})

async function fetchStatus() {
  try {
    const res = await $fetch<{ exists: boolean, size: number }>('/api/cookies')
    cookieExists.value = res.exists
    cookieSize.value = res.size
  } catch {}
}

function triggerFilePick() {
  fileInput.value?.click()
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    pasteText.value = reader.result as string
  }
  reader.readAsText(file)
}

async function save() {
  const content = pasteText.value.trim()
  if (!content) return

  saving.value = true
  saveMsg.value = ''
  try {
    const res = await $fetch<CookieSaveResponse>('/api/cookies', {
      method: 'POST',
      body: { cookies: content }
    })
    if (res.verified) {
      saveOk.value = true
      saveMsg.value = 'Cookies saved and verified!'
    } else if (res.verifyError) {
      saveOk.value = false
      saveMsg.value = res.verifyError
    } else {
      saveOk.value = true
      saveMsg.value = 'Cookies saved!'
    }
    await fetchStatus()
    if (res.verified) {
      pasteText.value = ''
      fileName.value = ''
    }
  } catch {
    saveOk.value = false
    saveMsg.value = 'Failed to save cookies.'
  } finally {
    saving.value = false
  }
}

async function deleteCookies() {
  deleting.value = true
  saveMsg.value = ''
  try {
    await $fetch('/api/cookies', {
      method: 'POST',
      body: { cookies: '' }
    })
    cookieExists.value = false
    cookieSize.value = 0
    saveOk.value = true
    saveMsg.value = 'Cookies removed.'
    pasteText.value = ''
  } catch {
    saveOk.value = false
    saveMsg.value = 'Failed to remove cookies.'
  } finally {
    deleting.value = false
  }
}

onMounted(fetchStatus)
</script>
