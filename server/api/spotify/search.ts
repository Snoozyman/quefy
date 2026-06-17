import { searchTracks, formatTrackResult } from '#server/utils/spotify'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.trim()
  if (!q || q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Query too short' })
  }

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50)

  try {
    const items = await searchTracks(q, limit)
    return items.map(formatTrackResult)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Spotify search failed'
    throw createError({
      statusCode: 502,
      statusMessage: message
    })
  }
})
