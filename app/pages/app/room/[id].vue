<template>
  <div
    v-if="loading"
    class="max-w-2xl mx-auto space-y-6 py-12 text-center text-muted"
  >
    Loading room...
  </div>
  <div v-else class="mx-2 w-80vw md:mx-4 md:w-2xl space-y-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <UCard class="w-full rounded-xl border border-default p-4">
        <h1 class="text-2xl font-bold">{{ roomState.title || "Room" }}</h1>
        <p class="text-sm text-muted">
          <NuxtLink to="/app/room" class="hover:underline">Rooms</NuxtLink>
          · Code:
          <code
            class="font-mono font-bold text-primary cursor-pointer select-all"
            @click="copyRoomCode"
          >
            {{ roomId }}
          </code>
          <span v-if="copied" class="ml-2 text-xs text-muted">Copied!</span>
        </p>
        <div class="flex items-center gap-2">
          <UButton
            v-if="isHost"
            size="sm"
            variant="outline"
            :icon="roomState.isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
            :disabled="playDisabled"
            @click="togglePlay"
          >
            {{ roomState.isPlaying ? "Pause" : "Play" }}
          </UButton>
          <UButton
            v-if="isHost"
            size="sm"
            variant="outline"
            icon="i-lucide-skip-forward"
            :disabled="!roomState.currentSong"
            @click="skip"
          >
            Skip
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            icon="i-lucide-download"
            @click="exportQueue"
          >
            Export
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Audio Player (host only) -->
    <div v-if="isHost" class="rounded-xl border border-default p-4 space-y-3">
      <div class="flex items-center gap-3">
        <div
          class="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center"
        >
          <UIcon name="i-lucide-music" class="size-6 text-muted" />
        </div>
        <div class="min-w-0">
          <p v-if="roomState.currentSong" class="font-medium truncate">
            {{ roomState.currentSong.title }}
          </p>
          <p v-else class="text-muted text-sm">Nothing playing</p>
          <p class="text-xs text-muted">
            {{
              roomState.currentSong
                ? roomState.isPlaying
                  ? "Playing"
                  : "Paused"
                : "Idle"
            }}
          </p>
        </div>
      </div>
      <div v-if="roomState.currentSong" class="space-y-1">
        <input
          ref="seekBar"
          type="range"
          min="0"
          max="1000"
          :value="seekValue"
          class="w-full accent-primary"
          @input="onSeek"
        />
        <div class="flex justify-between text-xs text-muted">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      <div v-if="roomState.currentSong" class="flex items-center gap-3">
        <UButton
          :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
          size="md"
          color="primary"
          variant="solid"
          @click="toggleLocalPlay"
        />
        <UIcon
          :name="volume === 0 ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
          class="size-5 text-muted shrink-0 cursor-pointer"
          @click="volume = volume === 0 ? 1 : 0"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="volume"
          class="w-20 accent-primary"
          @input="onVolumeChange"
        />
      </div>
      <audio
        ref="audioEl"
        hidden
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
        @error="onAudioError"
      />
    </div>

    <!-- Now playing (for joiners) -->
    <div
      v-else-if="roomState.currentSong"
      class="rounded-xl border border-default p-4"
    >
      <p class="text-xs text-muted mb-1">Now Playing</p>
      <p class="font-medium truncate">{{ roomState.currentSong.title }}</p>
    </div>

    <!-- Search / Add song -->
    <div class="search-container relative">
      <div class="flex gap-2 flex-col sm:flex-row">
        <UInput
          v-model="searchQuery"
          placeholder="Search YouTube or paste a URL"
          class="grow flex-5/6"
          :loading="searching"
          @input="onSearchInput"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter="addHighlighted"
        />
        <UButton
          :loading="addingSong"
          :disabled="!searchQuery.trim()"
          @click="addHighlighted"
          class="flex-1/6"
        >
          Add to Queue
        </UButton>
      </div>
      <div
        v-if="showResults && searchResults.length"
        class="absolute z-10 mt-1 w-full rounded-xl border border-default bg-background shadow-lg max-h-72 overflow-y-auto"
      >
        <button
          v-for="(r, i) in searchResults"
          :key="r.id"
          class="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
          :class="{ 'bg-muted/50': i === highlightIndex }"
          @click="selectResult(r)"
        >
          <img
            :src="r.thumbnail"
            alt=""
            class="size-10 rounded object-cover shrink-0"
          />
          <div class="min-w-0 grow">
            <p class="text-sm truncate">{{ r.title }}</p>
            <p class="text-xs text-muted">
              {{ r.channel }} · {{ r.durationString }}
            </p>
          </div>
          <UIcon name="i-lucide-plus" class="size-4 shrink-0 text-muted" />
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="text-sm text-red-500">
      {{ error }}
    </div>

    <!-- Queue -->
    <div class="space-y-2">
      <h2 class="font-semibold text-sm text-muted">
        Queue
        <span v-if="roomState.queue.length"
          >({{ roomState.queue.length }})</span
        >
      </h2>
      <div
        v-if="roomState.queue.length === 0"
        class="text-sm text-muted py-4 text-center"
      >
        Queue is empty. Add a song to get started.
      </div>
      <div
        v-for="song in roomState.queue"
        :key="song.id"
        class="flex items-center gap-3 rounded-lg border border-default px-3 py-2"
      >
        <UIcon name="i-lucide-music" class="size-4 shrink-0 text-muted" />
        <div class="min-w-0 grow">
          <p class="text-sm truncate">{{ song.title }}</p>
          <p class="text-xs text-muted">added by {{ song.addedBy }}</p>
        </div>
        <UButton
          v-if="isHost"
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          @click="removeSong(song.id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface SongData {
  id: string;
  videoId: string;
  title: string;
  url: string;
  addedBy: string;
  addedAt: number;
}

interface RoomState {
  id: string;
  title: string;
  currentSong: SongData | null;
  queue: SongData[];
  isPlaying: boolean;
  createdAt: number;
}

const route = useRoute();
const router = useRouter();
const roomId = route.params.id as string;

const loading = ref(true);
const addingSong = ref(false);
const error = ref("");
const searchQuery = ref("");
const searchResults = ref<SearchResult[]>([]);
const searching = ref(false);
const showResults = ref(false);
const highlightIndex = ref(-1);

interface SearchResult {
  id: string;
  title: string;
  channel: string;
  duration: number;
  durationString: string;
  thumbnail: string;
}

const roomState = ref<RoomState>({
  id: roomId,
  title: "",
  currentSong: null,
  queue: [],
  isPlaying: false,
  createdAt: 0,
});

const hostData = ref<{ roomId: string; hostToken: string } | null>(null);
const isHost = computed(
  () => hostData.value?.roomId === roomId && !!hostData.value?.hostToken,
);
const playDisabled = computed(
  () => !roomState.value.queue.length && !roomState.value.currentSong,
);

async function fetchRoomState() {
  try {
    roomState.value = await $fetch<RoomState>(`/api/room/${roomId}`);
  } catch {
    // room gone or network error
  }
}

// Audio player state (host only)
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.33);
const seekValue = ref(0);
const audioEl = ref<HTMLAudioElement>();
const seekBar = ref<HTMLInputElement>();
const copied = ref(false);

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

let searchTimer: ReturnType<typeof setTimeout>;

function onSearchInput() {
  const q = searchQuery.value.trim();
  if (extractVideoId(q)) {
    showResults.value = false;
    searchResults.value = [];
    return;
  }

  showResults.value = true;
  clearTimeout(searchTimer);
  if (q.length < 2) {
    searchResults.value = [];
    searching.value = false;
    return;
  }
  searching.value = true;
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await $fetch<SearchResult[]>(
        `/api/youtube/search?q=${encodeURIComponent(q)}&limit=8`,
      );
      highlightIndex.value = -1;
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 300);
}

function highlightNext() {
  if (!searchResults.value.length) return;
  highlightIndex.value =
    (highlightIndex.value + 1) % searchResults.value.length;
}

function highlightPrev() {
  if (!searchResults.value.length) return;
  highlightIndex.value =
    (highlightIndex.value - 1 + searchResults.value.length) %
    searchResults.value.length;
}

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
  );
  return match ? (match[1] ?? null) : null;
}

function addHighlighted() {
  const q = searchQuery.value.trim();
  if (!q) return;

  const videoId = extractVideoId(q);
  if (videoId) {
    addSongById(videoId);
    return;
  }

  const idx = highlightIndex.value;
  const r =
    idx >= 0 && idx < searchResults.value.length
      ? searchResults.value[idx]
      : searchResults.value[0];
  if (r) selectResult(r);
}

async function addSongById(videoId: string) {
  addingSong.value = true;
  error.value = "";
  showResults.value = false;
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: "POST",
      body: { videoId, addedBy: "Guest" },
    });
    searchQuery.value = "";
    searchResults.value = [];
    await fetchRoomState();
  } catch {
    error.value = "Failed to add song.";
  } finally {
    addingSong.value = false;
  }
}

async function selectResult(result: SearchResult) {
  addingSong.value = true;
  error.value = "";
  showResults.value = false;
  try {
    await $fetch(`/api/room/${roomId}/queue`, {
      method: "POST",
      body: { videoId: result.id, addedBy: "Guest" },
    });
    searchQuery.value = "";
    searchResults.value = [];
    await fetchRoomState();
  } catch {
    error.value = "Failed to add song.";
  } finally {
    addingSong.value = false;
  }
}

async function removeSong(songId: string) {
  if (!isHost.value || !hostData.value?.hostToken) return;
  try {
    await $fetch(`/api/room/${roomId}/remove`, {
      method: "POST",
      body: { songId, hostToken: hostData.value.hostToken },
    });
    await fetchRoomState();
  } catch {
    error.value = "Failed to remove song.";
  }
}

async function togglePlay() {
  if (!isHost.value || !hostData.value?.hostToken) return;
  try {
    const res = await $fetch<{
      isPlaying: boolean;
      currentSong: SongData | null;
    }>(`/api/room/${roomId}/play`, {
      method: "POST",
      body: { hostToken: hostData.value.hostToken },
    });
    roomState.value.isPlaying = res.isPlaying;
    if (res.currentSong) {
      roomState.value.currentSong = res.currentSong;
      if (audioEl.value) {
        audioEl.value.src = res.currentSong.url;
        audioEl.value.load();
        audioEl.value.play();
        playing.value = true;
      }
    }
  } catch (e: any) {
    error.value = e?.message || "Playback failed.";
  }
}

async function skip() {
  if (!isHost.value || !hostData.value?.hostToken) return;
  try {
    const res = await $fetch<{
      currentSong: SongData | null;
      isPlaying: boolean;
    }>(`/api/room/${roomId}/skip`, {
      method: "POST",
      body: { hostToken: hostData.value.hostToken },
    });
    roomState.value.currentSong = res.currentSong;
    roomState.value.isPlaying = res.isPlaying;
    if (res.currentSong && audioEl.value) {
      audioEl.value.src = res.currentSong.url;
      audioEl.value.load();
      audioEl.value.play();
      playing.value = true;
    } else {
      playing.value = false;
      audioEl.value?.pause();
    }
  } catch {
    error.value = "Failed to skip.";
  }
}

function toggleLocalPlay() {
  if (!audioEl.value) return;
  if (audioEl.value.paused) {
    audioEl.value.play();
  } else {
    audioEl.value.pause();
  }
}

function onTimeUpdate() {
  if (!audioEl.value) return;
  currentTime.value = audioEl.value.currentTime;
  if (duration.value) {
    seekValue.value = (audioEl.value.currentTime / duration.value) * 1000;
  }
}

function onLoadedMetadata() {
  if (!audioEl.value) return;
  duration.value = audioEl.value.duration;
}

function onSeek(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  seekValue.value = val;
  if (audioEl.value && duration.value) {
    audioEl.value.currentTime = (val / 1000) * duration.value;
  }
}

function onVolumeChange(e: Event) {
  volume.value = Number((e.target as HTMLInputElement).value);
  if (audioEl.value) audioEl.value.volume = volume.value;
}

function onEnded() {
  playing.value = false;
  skip();
}

function onAudioError() {
  error.value =
    "Playback error. The stream URL may have expired. Try skipping.";
  playing.value = false;
}

function copyRoomCode() {
  navigator.clipboard.writeText(roomId);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

async function exportQueue() {
  try {
    const data = await $fetch(`/api/room/${roomId}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${roomId}-queue.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    error.value = "Failed to export queue.";
  }
}

let pollTimer: ReturnType<typeof setInterval>;

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".search-container")) {
    showResults.value = false;
  }
}

onMounted(async () => {
  document.addEventListener("click", onClickOutside);

  try {
    const raw = localStorage.getItem("quefy-host");
    if (raw) hostData.value = JSON.parse(raw);
  } catch {}

  try {
    roomState.value = await $fetch<RoomState>(`/api/room/${roomId}`);
  } catch {
    router.push("/app/room");
    return;
  }
  loading.value = false;
  pollTimer = setInterval(fetchRoomState, 3000);

  if (
    roomState.value.currentSong?.url &&
    isHost.value &&
    roomState.value.isPlaying
  ) {
    const el = audioEl.value;
    if (el) {
      el.src = roomState.value.currentSong.url;
      el.load();
      el.play();
      playing.value = true;
    }
  }
});

onUnmounted(() => {
  clearInterval(pollTimer);
  clearTimeout(searchTimer);
  document.removeEventListener("click", onClickOutside);
});
</script>
