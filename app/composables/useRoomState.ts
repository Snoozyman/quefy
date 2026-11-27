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

  const hostData = ref<{ roomId: string; hostToken: string } | null>(null)
  const isHost = computed(
    () => hostData.value?.roomId === roomId.value && !!hostData.value?.hostToken
  )

  let eventSource: EventSource | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pageLeaving = false

  async function fetchRoomState() {
    try {
      roomState.value = await $fetch<RoomState>(`/api/room/${roomId.value}`)
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 404) {
        // Room expired, was deleted, or the server restarted.
        notFound.value = true
        stopRealtime()
      }
      // other network errors: keep the stale state and try again later
    }
  }

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000

  function startPolling() {
    if (pollTimer) return
    pollTimer = setInterval(fetchRoomState, 3000)
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  function stopRealtime() {
    stopPolling()
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = null
    eventSource?.close()
    eventSource = null
  }

  function connectSSE() {
    if (pageLeaving || notFound.value) return
    const sseUrl = hostData.value?.hostToken
      ? `/api/room/${roomId.value}/events?hostToken=${encodeURIComponent(hostData.value.hostToken)}`
      : `/api/room/${roomId.value}/events`
    const es = new EventSource(sseUrl)
    eventSource = es

    es.addEventListener('room-update', (event) => {
      roomState.value = JSON.parse(event.data) as RoomState
      // Stream is healthy again: drop the polling fallback.
      reconnectDelay = 1000
      stopPolling()
    })

    es.onerror = () => {
      if (pageLeaving || eventSource !== es) return
      // Poll while the stream is down so the UI stays current.
      startPolling()
      if (es.readyState === EventSource.CLOSED) {
        // The browser gave up (e.g. HTTP error); retry ourselves with backoff.
        eventSource = null
        reconnectTimer = setTimeout(connectSSE, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000)
      }
      // Otherwise readyState is CONNECTING: EventSource reconnects by itself.
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
    stopRealtime()
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
