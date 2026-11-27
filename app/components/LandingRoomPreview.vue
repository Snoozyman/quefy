<template>
  <!-- Static, decorative preview of a room -->
  <div
    class="mx-auto w-full max-w-md rounded-2xl border border-default bg-elevated/60 p-5 text-left shadow-2xl shadow-primary/5"
    aria-hidden="true"
  >
    <div class="mb-4 flex items-center justify-between">
      <div>
        <p class="text-lg font-bold text-highlighted">Friday Night</p>
        <p class="text-xs text-muted">3 songs queued · 11:42</p>
      </div>
      <span
        class="rounded-md border border-default px-2 py-1 font-mono text-sm tracking-widest"
        >K7QX</span
      >
    </div>
    <div class="flex items-center gap-4 rounded-xl bg-default/60 p-3">
      <div
        class="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/60 to-primary/10"
      >
        <UIcon name="i-lucide-disc-3" class="size-8 text-highlighted" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-1.5 text-xs text-muted">
          <span class="size-2 animate-pulse rounded-full bg-primary" />
          Now playing
        </p>
        <p class="truncate font-semibold">Midnight Drive</p>
        <div class="mt-2 h-1.5 rounded-full bg-accented">
          <div class="h-full w-2/5 rounded-full bg-primary" />
        </div>
      </div>
    </div>
    <ol class="mt-3 space-y-1">
      <li
        v-for="(song, i) in queue"
        :key="song.title"
        class="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm"
      >
        <span class="w-4 text-right text-xs text-dimmed">{{ i + 1 }}</span>
        <UIcon :name="song.icon" class="size-4 shrink-0 text-muted" />
        <span class="min-w-0 flex-1 truncate">{{ song.title }}</span>
        <span class="text-xs text-dimmed">{{ song.by }}</span>
        <span class="text-xs tabular-nums text-muted">{{ song.length }}</span>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
const queue = [
  { title: 'Late Night Tapes', by: 'Mia', length: '3:58', icon: 'i-simple-icons-youtube' },
  { title: 'Coastline', by: 'Sam', length: '4:21', icon: 'i-simple-icons-spotify' },
  { title: 'Lo-fi Sunrise Mix', by: 'Alex', length: '3:23', icon: 'i-simple-icons-soundcloud' }
]
</script>
