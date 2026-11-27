<template>
  <div class="h-dvh overflow-y-auto pb-16">
    <div class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
      <div class="mb-10 space-y-2 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted">
          Start listening
        </h1>
        <p class="text-muted">Host a new room or join one with its code.</p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <UCard :ui="{ body: 'space-y-4' }">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-primary/10"
            >
              <UIcon name="i-lucide-plus" class="size-5 text-primary" />
            </div>
            <div>
              <h2 class="font-semibold text-highlighted">Create a room</h2>
              <p class="text-xs text-muted">You'll be the host</p>
            </div>
          </div>
          <p class="text-sm text-muted">
            Your device plays the music. Share the code so others can join and
            add songs.
          </p>
          <form class="space-y-3" @submit.prevent="createRoom">
            <UInput
              v-model="roomTitle"
              placeholder="Room name (optional)"
              size="lg"
              class="w-full"
              maxlength="60"
              :disabled="creating"
            />
            <UButton
              type="submit"
              size="lg"
              block
              :loading="creating"
              trailing-icon="i-lucide-arrow-right"
            >
              Create room
            </UButton>
          </form>
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :description="error"
          />
          <p class="flex items-center gap-1.5 text-xs text-dimmed">
            <UIcon name="i-simple-icons-spotify" class="size-3.5" />
            Playing Spotify tracks needs the host's Spotify Premium.
          </p>
        </UCard>

        <UCard :ui="{ body: 'space-y-4' }">
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-elevated"
            >
              <UIcon name="i-lucide-log-in" class="size-5 text-muted" />
            </div>
            <div>
              <h2 class="font-semibold text-highlighted">Join a room</h2>
              <p class="text-xs text-muted">Add songs as a guest</p>
            </div>
          </div>
          <p class="text-sm text-muted">
            Enter the 4-letter code shown in the host's room.
          </p>
          <form class="space-y-3" @submit.prevent="joinRoom">
            <UInput
              :model-value="joinCode"
              placeholder="ABCD"
              size="xl"
              maxlength="4"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              aria-label="Room code"
              class="w-full"
              :ui="{ base: 'text-center font-mono text-2xl tracking-[0.5em] uppercase' }"
              @update:model-value="onCodeInput"
            />
            <UButton
              type="submit"
              size="lg"
              block
              color="neutral"
              variant="subtle"
              :disabled="joinCode.length !== 4"
            >
              Join room
            </UButton>
          </form>
        </UCard>
      </div>

      <div class="mt-8 text-center">
        <UButton
          to="/app/overview"
          variant="link"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
        >
          Browse active rooms
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { errorMessage } from '#shared/utils/error'

const router = useRouter()
const creating = ref(false)
const joinCode = ref('')
const roomTitle = ref('')
const error = ref('')

async function createRoom() {
  creating.value = true
  error.value = ''
  try {
    const data = await $fetch<{
      roomId: string
      hostToken: string
      title: string
    }>('/api/room/create', {
      method: 'POST',
      body: { title: roomTitle.value.trim() || undefined }
    })
    const hosts = JSON.parse(localStorage.getItem('quefy-hosts') || '{}')
    hosts[data.roomId] = data.hostToken
    localStorage.setItem('quefy-hosts', JSON.stringify(hosts))
    router.push(`/app/room/${data.roomId}`)
  } catch (err: unknown) {
    error.value = `Could not create the room: ${errorMessage(err, 'is the server running?')}`
  } finally {
    creating.value = false
  }
}

/** Keep only room-code characters, uppercased; join once 4 are typed. */
function onCodeInput(value: string | number) {
  joinCode.value = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
  if (joinCode.value.length === 4) joinRoom()
}

function joinRoom() {
  if (joinCode.value.length !== 4) return
  router.push(`/app/room/${joinCode.value}`)
}
</script>
