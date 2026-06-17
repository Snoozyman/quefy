import type { SpotifySearchResponse, TokenResponse } from '#shared/types/spotify'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let clientToken: CachedToken | null = null

export function getClientId(): string {
  return process.env.SPOTIFY_CLIENT_ID ?? ''
}

function getClientSecret(): string {
  return process.env.SPOTIFY_CLIENT_SECRET ?? ''
}

export function getRedirectUri(): string {
  return (
    process.env.SPOTIFY_REDIRECT_URI
    ?? 'http://localhost:3000/api/spotify/callback'
  )
}

async function getClientCredentialsToken(): Promise<string> {
  if (clientToken && Date.now() < clientToken.expiresAt) {
    return clientToken.accessToken
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  })

  if (!res.ok) {
    throw new Error(`Failed to get Spotify token: ${res.status}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  clientToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000
  }
  return clientToken.accessToken
}

function getMarket(): string {
  return process.env.SPOTIFY_MARKET ?? 'US'
}

export async function searchTracks(
  query: string,
  limit = 10
): Promise<SpotifySearchResponse['tracks']['items']> {
  const token = await getClientCredentialsToken()

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${Math.min(Math.max(limit, 1), 50)}&market=${encodeURIComponent(getMarket())}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`)
  }

  const data = (await res.json()) as SpotifySearchResponse
  return data.tracks?.items ?? []
}

export async function exchangeCode(
  code: string
): Promise<TokenResponse> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri()
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in
  }
}

export function formatTrackResult(item: SpotifySearchResponse['tracks']['items'][number]) {
  return {
    id: item.id,
    uri: item.uri,
    title: item.name,
    artists: item.artists.map(a => a.name),
    albumName: item.album.name,
    albumImageUrl: item.album.images?.[0]?.url ?? '',
    durationMs: (item as unknown as Record<string, unknown>).duration_ms as number,
    source: 'spotify' as const
  }
}
