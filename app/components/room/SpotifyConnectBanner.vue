<template>
  <div>
    <div
      v-if="!processing && !spotifyAuth.isAuthenticated.value && isHost"
      class="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
    >
      <div>
        <p class="font-semibold text-sm">
          Connect Spotify to play music
        </p>
        <p class="text-xs text-muted">
          Premium account required. The host must authenticate with Spotify.
        </p>
      </div>
      <UButton
        color="primary"
        size="sm"
        :loading="spotifyAuth.loading.value"
        @click="connect"
      >
        <template #leading>
          <UIcon
            name="i-lucide-music"
            class="size-4"
          />
        </template>
        Connect Spotify
      </UButton>
    </div>

    <div
      v-if="processing"
      class="rounded-xl border border-default p-4 space-y-3"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin text-muted"
        />
        <span class="text-sm">Connecting to Spotify...</span>
      </div>
    </div>

    <div
      v-if="spotifyError && spotifyAuth.isAuthenticated.value && !processing"
      class="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3"
    >
      <p class="text-sm">
        {{ spotifyError }}
      </p>
      <div class="flex gap-2">
        <UButton
          size="sm"
          color="warning"
          @click="retryPlayerInit"
        >
          Retry
        </UButton>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          @click="reconnect"
        >
          Reconnect
        </UButton>
      </div>
    </div>

    <p
      v-else-if="spotifyError"
      class="text-sm text-red-500"
    >
      {{ spotifyError }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  roomId: string
}>()

const emit = defineEmits<{
  'player-ready': []
  'host-verified': [value: boolean]
}>()

const spotifyAuth = useSpotifyAuth()
const spotifyPlayer = useSpotifyPlayer()
const processing = ref(false)
const spotifyError = ref('')

const storageHostData = ref<{ roomId: string, hostToken: string } | null>(null)
try {
  const raw = localStorage.getItem('quefy-host')
  if (raw) storageHostData.value = JSON.parse(raw)
} catch { /* localStorage access denied */ }

const isHost = computed(
  () => storageHostData.value?.roomId === props.roomId && !!storageHostData.value?.hostToken
)

async function connect() {
  processing.value = true
  try {
    await spotifyAuth.login(props.roomId)
  } catch (err: any) {
    spotifyError.value = err.message || 'Failed to connect to Spotify'
    processing.value = false
  }
}

async function initSpotifyPlayer() {
  const token = spotifyAuth.getAccessToken()
  processing.value = false
  if (!token) {
    spotifyError.value = 'Spotify session expired. Reconnect Spotify.'
    return
  }
  processing.value = true
  spotifyError.value = ''
  const ok = await spotifyPlayer.init(token)
  processing.value = false
  if (ok) {
    emit('player-ready')
  } else {
    spotifyError.value = spotifyPlayer.error.value || 'Failed to init Spotify player'
  }
}

function retryPlayerInit() {
  spotifyError.value = ''
  initSpotifyPlayer()
}

function reconnect() {
  spotifyError.value = ''
  spotifyAuth.logout()
}

async function verifyHost() {
  if (!storageHostData.value?.hostToken) return
  try {
    const res = await $fetch<{ isHost: boolean }>('/api/auth/verify-host', {
      method: 'POST',
      body: { roomId: props.roomId, hostToken: storageHostData.value.hostToken }
    })
    if (res.isHost) emit('host-verified', true)
  } catch {}

async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const spotifyErr = params.get('spotify_error')

  if (spotifyErr) {
    spotifyError.value = spotifyErr
    window.history.replaceState({}, '', `/app/room/${props.roomId}`)
    return
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const expiresIn = params.get('expires_in')

  if (!accessToken || !refreshToken || !expiresIn) return

  processing.value = true
  spotifyError.value = ''

  try {
    window.history.replaceState({}, '', `/app/room/${props.roomId}`)

    spotifyAuth.save({
      accessToken,
      refreshToken,
      expiresIn: parseInt(expiresIn, 10)
    })

    await verifyHost()

    await initSpotifyPlayer()
  } catch (err: any) {
    processing.value = false
    spotifyError.value = err?.message || 'Failed to complete Spotify authentication'
  }
}

onMounted(() => {
  const hasTokens = !!new URLSearchParams(window.location.search).get('access_token')
  if (hasTokens) {
    handleOAuthCallback()
    return
  }
  verifyHost()
  if (spotifyAuth.isAuthenticated.value && !spotifyPlayer.isReady.value) {
    initSpotifyPlayer()
  }
})
</script>
