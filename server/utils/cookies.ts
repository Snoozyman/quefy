import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'data')

export function getCookiePath(): string {
  return process.env.YT_DLP_COOKIES ?? join(DATA_DIR, 'cookies.txt')
}

export function saveCookieContent(content: string): { ok: true, size: number } {
  const path = getCookiePath()
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(path, content, 'utf-8')
  const size = Buffer.byteLength(content, 'utf-8')
  return { ok: true, size }
}

export function getCookieInfo(): { exists: boolean, size: number } {
  const path = getCookiePath()
  if (existsSync(path)) {
    return { exists: true, size: statSync(path).size }
  }
  return { exists: false, size: 0 }
}

export function getCookiePreview(): string {
  const path = getCookiePath()
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf-8').slice(0, 500)
}

export function deleteCookieFile(): void {
  const path = getCookiePath()
  if (existsSync(path)) {
    unlinkSync(path)
  }
}
