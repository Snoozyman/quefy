<template>
  <div>
    <div
      v-if="!spotifyAuth.isAuthenticated.value && !connecting"
      class="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
    >
      <div>
        <p class="font-semibold text-sm">Connect Spotify to play music</p>
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
          <UIcon name="i-lucide-music" class="size-4" />
        </template>
        Connect Spotify
      </UButton>
    </div>

    <div v-if="connecting" class="rounded-xl border border-default p-4 space-y-3">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-muted" />
        <span class="text-sm">Connecting to Spotify...</span>
      </div>
    </div>

    <p v-if="spotifyError" class="text-sm text-red-500">{{ spotifyError }}</p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  roomId: string
}>()

const emit = defineEmits<{
  'player-ready': []
}>()

const spotifyAuth = useSpotifyAuth()
const spotifyPlayer = useSpotifyPlayer()
const connecting = ref(false)
const spotifyError = ref('')

async function connect() {
  connecting.value = true
  try {
    await spotifyAuth.login(props.roomId)
  } catch (err: any) {
    spotifyError.value = err.message || 'Failed to connect Spotify'
    connecting.value = false
  }
}

async function initSpotifyPlayer() {
  const token = spotifyAuth.getAccessToken()
  if (!token) return
  connecting.value = true
  spotifyError.value = ''
  const ok = await spotifyPlayer.init(token)
  connecting.value = false
  if (ok) {
    emit('player-ready')
  } else {
    spotifyError.value = spotifyPlayer.error.value || 'Failed to init Spotify player'
  }
}

function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const expiresIn = params.get('expires_in')
  const spotifyErr = params.get('spotify_error')

  if (spotifyErr) {
    spotifyError.value = spotifyErr
  }

  if (accessToken && refreshToken && expiresIn) {
    spotifyAuth.save({
      accessToken,
      refreshToken,
      expiresIn: Number(expiresIn)
    })
    window.history.replaceState({}, '', `/app/room/${props.roomId}`)
    initSpotifyPlayer()
  }
}

onMounted(() => {
  handleOAuthCallback()
  if (spotifyAuth.isAuthenticated.value && !spotifyPlayer.isReady.value) {
    initSpotifyPlayer()
  }
})
</script>
