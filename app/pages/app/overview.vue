<template>
  <div class="max-w-2xl mx-auto mt-16 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Active Rooms</h1>
        <p class="text-sm text-muted">Join any room or create a new one</p>
      </div>
      <UButton to="/app/room" icon="i-lucide-plus" size="sm">
        New Room
      </UButton>
    </div>

    <div v-if="!loaded" class="text-center text-muted py-8">Loading...</div>
    <div v-else-if="rooms.length === 0" class="text-center text-muted py-8">
      No active rooms. Create one to get started.
    </div>
    <div v-else class="space-y-2">
      <NuxtLink
        v-for="r in rooms"
        :key="r.id"
        :to="`/app/room/${r.id}`"
        class="flex items-center justify-between rounded-lg border border-default px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div class="min-w-0">
          <p class="font-medium truncate">{{ r.title }}</p>
          <p class="text-xs text-muted">
            Code: <code class="font-mono">{{ r.id }}</code> ·
            {{ r.queueCount }} song{{ r.queueCount === 1 ? "" : "s" }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-muted">
            {{ timeAgo(r.createdAt) }}
          </span>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
const loaded = ref(false);
const rooms = ref<RoomSummary[]>([]);

interface RoomSummary {
  id: string;
  title: string;
  queueCount: number;
  createdAt: number;
}

async function fetchRooms() {
  try {
    rooms.value = await $fetch<RoomSummary[]>("/api/room/list");
  } catch {}
  loaded.value = true;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

onMounted(fetchRooms);
</script>
