import { getClientId, getRedirectUri } from '#server/utils/spotify'

export default defineEventHandler((event) => {
  const clientId = getClientId()
  const redirectUri = getRedirectUri(event)
  if (!clientId) {
    throw createError({ statusCode: 500, statusMessage: 'Spotify Client ID not configured' })
  }
  return { clientId, redirectUri }
})
