import { getClientId, getRedirectUri } from '#server/utils/spotify'

export default defineEventHandler(() => {
  const clientId = getClientId()
  const redirectUri = getRedirectUri()
  if (!clientId) {
    throw createError({ statusCode: 500, statusMessage: 'Spotify Client ID not configured' })
  }
  return { clientId, redirectUri }
})
