<template>
  <div class="h-dvh overflow-y-auto pb-16">
    <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-highlighted">
            Active rooms
          </h1>
          <p class="mt-1 text-sm text-muted">
            <template v-if="!loaded">Loading…</template>
            <template v-else-if="rooms.length">
              {{ rooms.length }} room{{ rooms.length === 1 ? '' : 's' }}
              <template v-if="playingCount">
                · {{ playingCount }} playing now
              </template>
            </template>
            <template v-else>No rooms yet</template>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UTooltip text="Refresh">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-refresh-cw"
              aria-label="Refresh"
              :loading="refreshing"
              @click="refresh"
            />
          </UTooltip>
          <UButton to="/app/room" icon="i-lucide-plus">New room</UButton>
        </div>
      </header>

      <div
        v-if="!loaded"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="h-24 animate-pulse rounded-2xl border border-default bg-elevated/50"
        />
      </div>

      <div
        v-else-if="rooms.length === 0"
        class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default px-6 py-16 text-center"
      >
        <UIcon name="i-lucide-radio" class="size-10 text-dimmed" />
        <div>
          <p class="font-medium">No active rooms</p>
          <p class="mt-1 text-sm text-muted">
            Create one and share the code with your friends.
          </p>
        </div>
        <UButton to="/app/room" icon="i-lucide-plus" class="mt-2">
          Create a room
        </UButton>
      </div>

      <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="r in rooms" :key="r.id">
          <NuxtLink
            :to="`/app/room/${r.id}`"
            class="group flex items-center gap-4 rounded-2xl border border-default bg-elevated/30 p-4 transition-colors hover:border-accented hover:bg-elevated/70"
          >
            <div class="relative shrink-0">
              <img
                v-if="r.currentThumbnail"
                :src="r.currentThumbnail"
                alt=""
                class="size-16 rounded-xl object-cover"
              />
              <div
                v-else
                class="flex size-16 items-center justify-center rounded-xl bg-muted"
              >
                <UIcon name="i-lucide-music" class="size-6 text-dimmed" />
              </div>
              <UIcon
                v-if="r.currentSource"
                :name="sourceIcon(r.currentSource)"
                class="absolute -bottom-1 -right-1 size-4 rounded-full bg-default p-0.5 text-muted"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-semibold text-highlighted">
                  {{ r.title }}
                </p>
                <UBadge
                  v-if="r.isPlaying"
                  label="Live"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  class="shrink-0"
                />
              </div>
              <p class="mt-1 text-xs text-muted">
                <span class="font-mono tracking-wider">{{ r.id }}</span>
                · {{ r.queueCount }} song{{ r.queueCount === 1 ? '' : 's' }}
                · {{ timeAgo(r.createdAt) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
            />
          </NuxtLink>
        </li>
      </ul>
    </div>
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
  if (min < 60) return `${min} min ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

let pollTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  fetchRooms()
  pollTimer = setInterval(fetchRooms, 10_000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>
