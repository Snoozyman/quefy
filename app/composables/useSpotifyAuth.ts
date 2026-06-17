import type { TokenResponse } from '#shared/types/spotify'

const STORAGE_KEY = 'quefy-spotify'

interface StoredAuth {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

let loaded = false
const auth = ref<StoredAuth | null>(null)
const loading = ref(false)

function load(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as StoredAuth
      auth.value = data
      return data
    }
  } catch {}
  return null
}

function save(tokens: TokenResponse) {
  const data: StoredAuth = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000 - 60_000
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  auth.value = data
}

function clear() {
  localStorage.removeItem(STORAGE_KEY)
  auth.value = null
}

export function useSpotifyAuth() {
  if (!loaded) {
    load()
    loaded = true
  }

  async function login(roomId: string) {
    const config = useRuntimeConfig()
    const clientId = config.public.spotifyClientId
    if (!clientId) {
      throw new Error(
        'Spotify Client ID not configured. Add NUXT_PUBLIC_SPOTIFY_CLIENT_ID to .env.local'
      )
    }

    loading.value = true
    const state = `${roomId}:${crypto.randomUUID()}`
    const redirectUri = `${window.location.origin}/api/spotify/callback`
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' ')

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      scope: scopes
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  function logout() {
    clear()
  }

  const isAuthenticated = computed(() => {
    if (!auth.value) return false
    return Date.now() < auth.value.expiresAt
  })

  async function refreshToken(): Promise<boolean> {
    if (!auth.value?.refreshToken) return false
    try {
      const tokens = await $fetch<TokenResponse>('/api/spotify/refresh', {
        method: 'POST',
        body: { refreshToken: auth.value.refreshToken }
      })
      save(tokens)
      return true
    } catch {
      clear()
      return false
    }
  }

  function getAccessToken(): string | null {
    if (!auth.value) return null
    if (Date.now() >= auth.value.expiresAt) return null
    return auth.value.accessToken
  }

  return {
    auth: readonly(auth),
    loading: readonly(loading),
    isAuthenticated,
    login,
    logout,
    refreshToken,
    getAccessToken,
    save,
    load
  }
}
