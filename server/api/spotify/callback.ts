import { errorMessage } from '#shared/utils/error'
import { exchangeCode } from '#server/utils/spotify'

/**
 * OAuth redirect target. Tokens are handed to the client in the URL
 * fragment (never sent to servers, proxies or logs) together with the
 * original `state`, which the client checks against the nonce it stored
 * before starting the login.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''

  const roomId = state.split(':')[0] ?? ''
  const base = /^[A-Za-z0-9]{1,16}$/.test(roomId)
    ? `/app/room/${roomId}`
    : '/app/room'

  if (typeof query.error === 'string') {
    const params = new URLSearchParams({ spotify_error: query.error, state })
    return sendRedirect(event, `${base}#${params.toString()}`)
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing authorization code'
    })
  }

  try {
    const tokens = await exchangeCode(code)
    const params = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: String(tokens.expiresIn),
      state
    })
    return sendRedirect(event, `${base}#${params.toString()}`)
  } catch (err: unknown) {
    const params = new URLSearchParams({
      spotify_error: errorMessage(err, 'Auth failed'),
      state
    })
    return sendRedirect(event, `${base}#${params.toString()}`)
  }
})
