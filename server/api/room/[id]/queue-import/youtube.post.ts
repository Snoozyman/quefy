import { isYoutubePlaylistUrl } from '#shared/utils/urls'
import { getRoom, verifyHost, bulkAddToQueue } from '#server/utils/room'
import { emitRoomUpdate } from '#server/utils/room-events'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing room ID' })

  const room = getRoom(id)
  if (!room)
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })

  const body = await readBody<{
    hostToken: string
    playlistUrl: string
  }>(event)

  if (!body?.hostToken)
    throw createError({ statusCode: 400, statusMessage: 'Missing hostToken' })

  if (!verifyHost(id, body.hostToken))
    throw createError({
      statusCode: 403,
      statusMessage: 'Only the host can import'
    })

  if (!body.playlistUrl || !isYoutubePlaylistUrl(body.playlistUrl))
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid YouTube playlist URL'
    })

  const { getYtDlpBaseArgs, runYtDlp } = await import('#server/utils/yt-dlp')
  const { getCookiesArgs } = await import('#server/utils/cookies')
  const { parseYtDlpError, getStderr } = await import(
    '#server/utils/yt-dlp-errors'
  )

  let stdout: string
  try {
    const result = await runYtDlp(() => [
      ...getYtDlpBaseArgs(),
      '--flat-playlist',
      '--print-json',
      '--no-warnings',
      ...getCookiesArgs(),
      '--',
      body.playlistUrl
    ])
    stdout = result.stdout
  } catch (err: unknown) {
    const stderr = getStderr(err)
    console.error('[yt-dlp playlist]', stderr)
    throw createError({
      statusCode: 502,
      statusMessage: parseYtDlpError(stderr) || 'Failed to fetch playlist'
    })
  }

  const lines = stdout.trim().split('\n').filter(Boolean)
  if (lines.length === 0)
    throw createError({
      statusCode: 422,
      statusMessage: 'Playlist is empty or unavailable'
    })

  const songs = lines.map((line) => {
    const item = JSON.parse(line)
    const videoId: string = item.id
    return {
      source: 'youtube' as const,
      title: item.title || item.fulltitle || 'Unknown Title',
      addedBy: 'Host',
      videoId,
      albumImageUrl:
        item.thumbnails?.[0]?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationMs: Math.round((item.duration ?? 0) * 1000)
    }
  })

  const added = bulkAddToQueue(id, songs)
  emitRoomUpdate(id, room)

  return { count: added.length }
})
