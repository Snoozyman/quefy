import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { saveCookieContent, deleteCookieFile, getCookiePath, isValidNetscapeFormat } from '#server/utils/cookies'
import { clearAudioCache } from '#server/utils/youtube'

const execFileAsync = promisify(execFile)

export default defineEventHandler(async (event) => {
  const contentType = getHeader(event, 'content-type') ?? ''

  let content: string

  if (contentType.includes('multipart/form-data')) {
    const body = await readMultipartFormData(event)
    const file = body?.find(p => p.name === 'file' || p.name === 'cookies' || p.filename)
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }
    content = file.data.toString('utf-8')
  } else {
    const body = await readBody(event)
    if (typeof body === 'string') {
      content = body
    } else if (body?.cookies !== undefined) {
      content = String(body.cookies)
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Send cookies as text/plain or JSON { cookies: "..." }' })
    }
  }

  clearAudioCache()

  if (!content.trim()) {
    deleteCookieFile()
    return { ok: true, size: 0, deleted: true }
  }

  if (!isValidNetscapeFormat(content)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid cookies format. Expected Netscape-format cookies (tab-separated fields).' })
  }

  saveCookieContent(content)

  let verified = false
  let verifyError = ''
  try {
    const cookiesPath = getCookiePath()
    if (existsSync(cookiesPath)) {
      await execFileAsync('yt-dlp', [
        '--cookies', cookiesPath,
        'ytsearch1:test',
        '--flat-playlist',
        '--print-json',
        '--no-warnings',
        '--timeout', '10'
      ], { timeout: 15000 })
      verified = true
    }
  } catch {
    verifyError = 'Cookies saved but verification failed. They may be expired or in the wrong format.'
  }

  return { ok: true, size: content.length, verified, verifyError }
})
