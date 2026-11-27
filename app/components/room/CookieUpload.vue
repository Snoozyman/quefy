<template>
  <div>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      icon="i-lucide-cookie"
      @click="open = true"
    >
      {{ statusText }}
    </UButton>

    <UModal
      v-model:open="open"
      title="Cookies"
      :description="
        cookieExists
          ? `Stored for YouTube and SoundCloud (${cookieSize} bytes)`
          : 'No cookies stored yet'
      "
    >
      <template #body>
        <div class="space-y-5">
          <p class="text-sm text-muted">
            yt-dlp uses these to reach YouTube and SoundCloud. Auto-fetch gets
            anonymous session cookies; for age-restricted or members-only
            videos, upload a Netscape-format
            <code class="text-default">cookies.txt</code> exported from a
            signed-in browser.
          </p>

          <div class="flex flex-wrap gap-2">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-wand-sparkles"
              :loading="fetching"
              @click="autoFetch"
            >
              Auto-fetch
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-file-up"
              @click="triggerFilePick"
            >
              Choose file
            </UButton>
            <input
              ref="fileInput"
              type="file"
              accept=".txt"
              class="hidden"
              @change="onFilePicked"
            />
          </div>

          <div class="space-y-2">
            <UTextarea
              v-model="pasteText"
              :placeholder="fileName ? `Loaded ${fileName}` : 'Or paste cookies.txt contents here'"
              :rows="5"
              autoresize
              :maxrows="10"
              class="w-full"
              :ui="{ base: 'font-mono text-xs' }"
            />
            <UButton
              block
              :disabled="!pasteText.trim()"
              :loading="saving"
              @click="save"
            >
              Save cookies
            </UButton>
          </div>

          <UAlert
            v-if="saveMsg"
            :color="saveOk ? 'success' : 'error'"
            variant="soft"
            :icon="saveOk ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
            :description="saveMsg"
          />

          <div
            v-if="cookieExists && (ytCookies.length || scCookies.length)"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <UTabs
                v-model="activeTab"
                :items="tabItems"
                :content="false"
                size="xs"
                color="neutral"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :loading="deleting"
                @click="deleteCookies"
              >
                Remove all
              </UButton>
            </div>
            <div
              class="max-h-40 overflow-y-auto rounded-lg border border-default"
            >
              <div
                v-if="activeCookies.length === 0"
                class="py-4 text-center text-xs text-muted"
              >
                No cookies for this site
              </div>
              <div
                v-for="c in activeCookies"
                :key="`${c.domain}-${c.name}`"
                class="flex items-center gap-2 border-b border-default px-3 py-1.5 text-xs last:border-b-0"
              >
                <span class="min-w-0 flex-1 truncate font-mono">{{
                  c.name
                }}</span>
                <span class="min-w-0 truncate text-muted">{{ c.domain }}</span>
                <span class="shrink-0 tabular-nums text-muted">{{
                  formatExpiry(c.expires)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { errorMessage } from '#shared/utils/error'

const props = defineProps<{
  roomId: string
  hostToken: string
}>()

const hostHeaders = computed(() => ({
  'x-room-id': props.roomId,
  'x-host-token': props.hostToken
}))

interface CookieEntry {
  name: string
  domain: string
  expires: number
}

interface CookieSaveResponse {
  ok: boolean
  size: number
  verified?: boolean
  verifyError?: string
}

interface CookieRefreshResponse {
  ok: boolean
  count: number
  youtube: CookieEntry[] | null
  soundcloud: CookieEntry[] | null
}

interface CookieStatusResponse {
  exists: boolean
  size: number
  youtube?: CookieEntry[]
  soundcloud?: CookieEntry[]
}

const open = ref(false)
const cookieExists = ref(false)
const cookieSize = ref(0)
const fileInput = ref<HTMLInputElement | undefined>()
const fileName = ref('')
const pasteText = ref('')
const saving = ref(false)
const fetching = ref(false)
const deleting = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)
const ytCookies = ref<CookieEntry[]>([])
const scCookies = ref<CookieEntry[]>([])
const activeTab = ref<'youtube' | 'soundcloud'>('youtube')

const tabItems = computed(() => [
  { value: 'youtube', label: `YouTube (${ytCookies.value.length})` },
  { value: 'soundcloud', label: `SoundCloud (${scCookies.value.length})` }
])

const activeCookies = computed(() =>
  activeTab.value === 'youtube' ? ytCookies.value : scCookies.value
)

const statusText = computed(() => {
  if (cookieExists.value) return 'Manage'
  return 'Add'
})

async function fetchStatus() {
  try {
    const res = await $fetch<CookieStatusResponse>('/api/cookies')
    cookieExists.value = res.exists
    cookieSize.value = res.size
    ytCookies.value = res.youtube ?? []
    scCookies.value = res.soundcloud ?? []
  } catch {
    cookieExists.value = false
    cookieSize.value = 0
    ytCookies.value = []
    scCookies.value = []
  }
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
      headers: hostHeaders.value,
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
  } catch (err: unknown) {
    saveOk.value = false
    saveMsg.value = `Failed to save cookies: ${errorMessage(err)}`
  } finally {
    saving.value = false
  }
}

async function autoFetch() {
  fetching.value = true
  saveMsg.value = ''
  try {
    const res = await $fetch<CookieRefreshResponse>('/api/cookies/refresh', {
      method: 'POST',
      headers: hostHeaders.value
    })
    ytCookies.value = res.youtube ?? []
    scCookies.value = res.soundcloud ?? []
    activeTab.value = ytCookies.value.length ? 'youtube' : 'soundcloud'
    saveOk.value = true
    saveMsg.value = `Fetched ${res.count} cookies.`
    await fetchStatus()
  } catch (err: unknown) {
    saveOk.value = false
    saveMsg.value = errorMessage(err, 'Failed to auto-fetch cookies.')
  } finally {
    fetching.value = false
  }
}

async function deleteCookies() {
  deleting.value = true
  saveMsg.value = ''
  try {
    await $fetch('/api/cookies', {
      method: 'POST',
      headers: hostHeaders.value,
      body: { cookies: '' }
    })
    cookieExists.value = false
    cookieSize.value = 0
    ytCookies.value = []
    scCookies.value = []
    saveOk.value = true
    saveMsg.value = 'Cookies removed.'
    pasteText.value = ''
  } catch (err: unknown) {
    saveOk.value = false
    saveMsg.value = `Failed to remove cookies: ${errorMessage(err)}`
  } finally {
    deleting.value = false
  }
}

function formatExpiry(ts: number): string {
  if (!ts) return 'Session'
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(fetchStatus)
</script>
