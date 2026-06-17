import { refreshAccessToken } from '#server/utils/spotify'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ refreshToken?: string }>(event).catch(() => ({} as { refreshToken?: string }))

  if (!body?.refreshToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing refreshToken'
    })
  }

  try {
    const tokens = await refreshAccessToken(body.refreshToken)
    return tokens
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token refresh failed'
    throw createError({
      statusCode: 502,
      statusMessage: message
    })
  }
})
