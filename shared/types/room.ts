export interface SongData {
  id: string
  source: 'youtube' | 'spotify' | 'soundcloud'
  title: string
  addedBy: string
  addedAt: number
  videoId?: string
  url?: string
  trackUri?: string
  trackUrl?: string
  artists?: string[]
  albumName?: string
  albumImageUrl?: string
  durationMs?: number
}

export interface SearchResult {
  id: string
  title: string
  channel?: string
  duration?: number
  durationString?: string
  thumbnail: string
  source: 'youtube' | 'spotify' | 'soundcloud'
  uri?: string
  artists?: string[]
  albumName?: string
  durationMs?: number
}

export interface RoomState {
  id: string
  title: string
  currentSong: SongData | null
  queue: SongData[]
  isPlaying: boolean
  spotifyConnected: boolean
  createdAt: number
  position: number
}
