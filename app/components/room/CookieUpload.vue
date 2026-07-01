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
        <div class="p-4 space-y-4 min-w-sm">
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
            Cookies help yt-dlp access age-restricted or private videos.
            You can auto-fetch session cookies, or manually upload a Netscape-format
            <code>cookies.txt</code> file.
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
              size="sm"
              variant="outline"
              :loading="fetching"
              @click="autoFetch"
            >
              Auto-Fetch
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

          <div
            v-if="cookieExists && (ytCookies.length || scCookies.length)"
            class="space-y-2"
          >
            <div class="flex gap-px bg-border rounded-lg">
              <button
                v-for="tab in tabs"
                :key="tab.source"
                class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                :class="activeTab === tab.source
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-default text-muted hover:bg-muted/50'"
                @click="activeTab = tab.source"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="max-h-32 overflow-y-auto rounded-lg border border-default">
              <div
                v-if="activeCookies.length === 0"
                class="text-xs text-muted text-center py-4"
              >
                No cookies found
              </div>
              <div
                v-for="c in activeCookies"
                :key="c.name"
                class="flex items-center justify-between px-3 py-1.5 text-xs border-b border-default last:border-b-0"
              >
                <span class="font-mono truncate mr-2">{{ c.name }}</span>
                <span class="text-muted truncate">{{ c.domain }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
interface CookieEntry {
  name: string
  domain: string
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

const tabs = computed(() => [
  { source: 'youtube' as const, label: `YouTube (${ytCookies.value.length})` },
  { source: 'soundcloud' as const, label: `SoundCloud (${scCookies.value.length})` }
])

const activeCookies = computed(() =>
  activeTab.value === 'youtube' ? ytCookies.value : scCookies.value
)

const statusText = computed(() => {
  if (cookieExists.value) return `Cookies (${cookieSize.value}b)`
  return 'Cookies'
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

async function autoFetch() {
  fetching.value = true
  saveMsg.value = ''
  try {
    const res = await $fetch<CookieRefreshResponse>('/api/cookies/refresh')
    ytCookies.value = res.youtube ?? []
    scCookies.value = res.soundcloud ?? []
    activeTab.value = ytCookies.value.length ? 'youtube' : 'soundcloud'
    saveOk.value = true
    saveMsg.value = `Fetched ${res.count} cookies.`
    await fetchStatus()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, message?: string }
    saveOk.value = false
    saveMsg.value = e?.data?.statusMessage || e?.message || 'Failed to auto-fetch cookies.'
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
      body: { cookies: '' }
    })
    cookieExists.value = false
    cookieSize.value = 0
    ytCookies.value = []
    scCookies.value = []
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
