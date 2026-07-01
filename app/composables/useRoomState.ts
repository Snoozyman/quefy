import type { RoomState } from '#shared/types/room'

export function useRoomState(roomId: Ref<string>) {
  const loading = ref(true)
  const notFound = ref(false)
  const error = ref('')

  const roomState = ref<RoomState>({
    id: roomId.value,
    title: '',
    currentSong: null,
    queue: [],
    isPlaying: false,
    spotifyConnected: false,
    createdAt: 0,
    position: 0
  })

  const hostData = ref<{ roomId: string, hostToken: string } | null>(null)
  const isHost = computed(
    () => hostData.value?.roomId === roomId.value && !!hostData.value?.hostToken
  )

  let eventSource: EventSource | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pageLeaving = false

  async function fetchRoomState() {
    try {
      roomState.value = await $fetch<RoomState>(`/api/room/${roomId.value}`)
    } catch {
      // network error, stale state is ok
    }
  }

  function startPolling() {
    if (pollTimer) return
    pollTimer = setInterval(fetchRoomState, 3000)
  }

  function connectSSE() {
    const sseUrl = hostData.value?.hostToken
      ? `/api/room/${roomId.value}/events?hostToken=${hostData.value.hostToken}`
      : `/api/room/${roomId.value}/events`
    eventSource = new EventSource(sseUrl)

    eventSource.addEventListener('room-update', (event) => {
      const newState = JSON.parse(event.data) as RoomState
      roomState.value = newState
    })

    eventSource.onerror = () => {
      if (pageLeaving) return
      console.warn('SSE connection failed, falling back to polling')
      eventSource?.close()
      eventSource = null
      startPolling()
    }
  }

  function cleanup() {
    pageLeaving = true
    if (isHost.value && hostData.value?.hostToken) {
      $fetch(`/api/room/${roomId.value}/spotify-disconnect`, {
        method: 'POST',
        body: { hostToken: hostData.value.hostToken }
      }).catch(() => {})
    }
    eventSource?.close()
    if (pollTimer) clearInterval(pollTimer)
  }

  onMounted(async () => {
    const hosts = JSON.parse(localStorage.getItem('quefy-hosts') || '{}')
    const hostToken = hosts[roomId.value]
    if (hostToken) {
      hostData.value = { roomId: roomId.value, hostToken }
    }

    try {
      roomState.value = await $fetch<RoomState>(`/api/room/${roomId.value}`)
    } catch {
      notFound.value = true
      loading.value = false
      return
    }
    loading.value = false
    connectSSE()

    window.addEventListener('beforeunload', () => {
      pageLeaving = true
    })
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    roomState,
    loading,
    notFound,
    error,
    isHost,
    hostData,
    fetchRoomState
  }
}
