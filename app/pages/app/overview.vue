<template>
  <div class="w-full md:w-3xl mx-auto space-y-6 p-8">
    <UCard>
      <template #header>
        <div class="space-y-3">
          <div>
            <h1 class="text-lg font-semibold">Active Rooms</h1>
            <p v-if="loaded && rooms.length" class="text-sm text-muted mt-0.5">
              {{ rooms.length }} room{{ rooms.length === 1 ? '' : 's' }} online
              <span v-if="playingCount"> · {{ playingCount }} playing</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              to="/app/room"
              icon="i-lucide-plus"
              size="md"
              color="primary"
              variant="solid"
            >
              New Room
            </UButton>
            <UButton
              size="md"
              variant="ghost"
              icon="i-lucide-refresh-cw"
              :loading="refreshing"
              @click="refresh"
            />
          </div>
        </div>
      </template>

      <div v-if="!loaded" class="space-y-3">
        <div v-for="n in 3" :key="n" class="flex items-center gap-3 px-4 py-3">
          <div class="size-10 rounded-lg bg-muted shrink-0 animate-pulse" />
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-muted rounded w-32 animate-pulse" />
            <div class="h-3 bg-muted rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>

      <div v-else-if="rooms.length === 0" class="py-8 text-center">
        <UIcon name="i-lucide-radio" class="size-10 text-muted mb-3" />
        <p class="text-sm font-medium">No active rooms</p>
        <p class="text-xs text-muted mt-1">Create one to get started.</p>
      </div>

      <div v-else class="divide-y divide-border -mx-4">
        <NuxtLink
          v-for="r in rooms"
          :key="r.id"
          :to="`/app/room/${r.id}`"
          class="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors first:rounded-t-[inherit] last:rounded-b-[inherit]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="shrink-0 relative">
              <img
                v-if="r.currentThumbnail"
                :src="r.currentThumbnail"
                alt=""
                class="size-10 rounded-lg object-cover"
              />
              <div
                v-else
                class="size-10 rounded-lg bg-muted flex items-center justify-center"
              >
                <UIcon name="i-lucide-music" class="size-5 text-muted" />
              </div>
              <span
                v-if="r.isPlaying"
                class="absolute -top-1 -right-1 flex size-3 rounded-full ring-2 ring-default bg-green-500"
              />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">
                {{ r.title }}
              </p>
              <p class="text-xs text-muted flex items-center gap-1 mt-0.5">
                <code class="font-mono text-xs">{{ r.id }}</code>
                · {{ r.queueCount }} track{{ r.queueCount === 1 ? '' : 's' }}
                <template v-if="r.currentSource">
                  <span class="opacity-50">·</span>
                  <UIcon :name="sourceIcon(r.currentSource)" class="size-3" />
                </template>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0 ml-3">
            <div class="text-right">
              <template v-if="r.isPlaying">
                <span class="text-xs text-green-500 font-medium">Live</span>
              </template>
              <template v-else>
                <span class="text-xs text-muted">{{
                  timeAgo(r.createdAt)
                }}</span>
              </template>
            </div>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
          </div>
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const loaded = ref(false)
const refreshing = ref(false)
const rooms = ref<RoomSummary[]>([])

interface RoomSummary {
  id: string
  title: string
  queueCount: number
  createdAt: number
  isPlaying: boolean
  currentSource: string | null
  currentThumbnail: string | null
}

const playingCount = computed(
  () => rooms.value.filter((r) => r.isPlaying).length
)

async function fetchRooms() {
  try {
    rooms.value = await $fetch<RoomSummary[]>('/api/room/list')
  } catch {
    // network error, keep previous list
  } finally {
    loaded.value = true
  }
}

async function refresh() {
  refreshing.value = true
  await fetchRooms()
  refreshing.value = false
}

function sourceIcon(source: string): string {
  if (source === 'spotify') return 'i-simple-icons-spotify'
  if (source === 'soundcloud') return 'i-simple-icons-soundcloud'
  return 'i-simple-icons-youtube'
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

onMounted(fetchRooms)
</script>
