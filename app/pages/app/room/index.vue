<template>
  <div class="max-w-lg mx-auto mt-16 space-y-8">
    <div class="text-center space-y-2">
      <h1 class="text-3xl font-bold">Room</h1>
      <p class="text-muted">Create a room to host, or join an existing one</p>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">Create a Room</h2>
      </template>
      <p class="text-sm text-muted mb-4">
        You'll be the host — only your device plays audio. Share the room code
        so others can join and queue songs.
      </p>
      <UInput
        v-model="roomTitle"
        placeholder="Room name (optional)"
        class="mb-3"
        :disabled="creating"
      />
      <p v-if="error" class="text-sm text-red-500 mb-2">{{ error }}</p>
      <UButton :loading="creating" size="lg" class="w-full" @click="createRoom">
        Create Room
      </UButton>
    </UCard>

    <div class="flex items-center gap-3">
      <div class="h-px grow bg-border" />
      <span class="text-sm text-muted">or</span>
      <div class="h-px grow bg-border" />
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">Join a Room</h2>
      </template>
      <div class="flex gap-2">
        <UInput
          v-model="joinCode"
          placeholder="Enter room code"
          size="lg"
          class="grow text-center"
          maxlength="4"
          @keydown.enter="joinRoom"
        />
        <UButton size="lg" :disabled="!joinCode.trim()" @click="joinRoom">
          Join
        </UButton>
      </div>
    </UCard>

    <div class="text-center">
      <NuxtLink to="/app/overview" class="text-sm text-primary hover:underline">
        Browse active rooms →
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const creating = ref(false);
const joinCode = ref("");
const roomTitle = ref("");
const error = ref("");

async function createRoom() {
  creating.value = true;
  error.value = "";
  try {
    const data = await $fetch<{
      roomId: string;
      hostToken: string;
      title: string;
    }>("/api/room/create", {
      method: "POST",
      body: { title: roomTitle.value.trim() || undefined },
    });
    localStorage.setItem(
      "quefy-host",
      JSON.stringify({ roomId: data.roomId, hostToken: data.hostToken }),
    );
    router.push(`/app/room/${data.roomId}`);
  } catch (e) {
    error.value = "Failed to create room. Is the server running?";
    console.error("Failed to create room:", e);
  } finally {
    creating.value = false;
  }
}

function joinRoom() {
  const code = joinCode.value.trim().toUpperCase();
  if (!code) return;
  router.push(`/app/room/${code}`);
}
</script>
