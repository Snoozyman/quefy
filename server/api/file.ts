export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const videoId = (query.videoId as string) ?? 'dQw4w9WgXcQ'

  try {
    const audio = await getAudioStreamUrl(videoId)
    return audio
  } catch (error) {
    console.error('Error fetching YouTube audio:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch audio stream'
    })
  }
})
