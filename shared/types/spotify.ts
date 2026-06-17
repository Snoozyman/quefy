export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  durationMs: number
  explicit: boolean
  popularity: number
  externalUrl: string
  previewUrl: string | null
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  externalUrl: string
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
  uri: string
  externalUrl: string
  releaseDate: string
  totalTracks: number
}

export interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[]
    total: number
    limit: number
    offset: number
  }
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface SpotifyPlayerState {
  trackWindow: {
    currentTrack: SpotifyTrack | null
  }
  paused: boolean
  position: number
  duration: number
}
