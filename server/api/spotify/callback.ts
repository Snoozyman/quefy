import { exchangeCode, getRedirectUri } from '#server/utils/spotify'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const state = (query.state as string) ?? ''

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing authorization code'
    })
  }

  let roomId = ''
  if (state) {
    const parts = state.split(':')
    if (parts.length >= 1) roomId = parts[0]!
  }

  try {
    const tokens = await exchangeCode(code)
    const params = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: String(tokens.expiresIn)
    })
    const redirect = roomId
      ? `/app/room/${roomId}?${params.toString()}`
      : `/app/room?${params.toString()}`
    return sendRedirect(event, redirect)
  } catch (err: any) {
    const redirect = roomId
      ? `/app/room/${roomId}?spotify_error=${encodeURIComponent(err.message || 'Auth failed')}`
      : `/app/room?spotify_error=${encodeURIComponent(err.message || 'Auth failed')}`
    return sendRedirect(event, redirect)
  }
})
