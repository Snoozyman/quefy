import { execFile, type ExecFileOptions } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { autoRefreshCookies } from './cookie-refresh'
import { getStderr, isCookieRefreshable } from './yt-dlp-errors'

const execFileAsync = promisify(execFile)

let cachedPath: string | null = null

export function getYtDlpPath(): string {
  if (cachedPath) return cachedPath

  const candidates = [
    join(homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp'
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      cachedPath = candidate
      return cachedPath
    }
  }

  cachedPath = 'yt-dlp'
  return cachedPath
}

export function getYtDlpBaseArgs(): string[] {
  return ['--js-runtimes', 'bun']
}

/**
 * Run yt-dlp. `buildArgs` is called per attempt so cookie args reflect the
 * current cookie file. If the first attempt fails in a way fresh anonymous
 * cookies can fix (bot check, 403, sign-in prompt), cookies are refreshed
 * and the command is retried once; otherwise the original error is thrown.
 */
export async function runYtDlp(
  buildArgs: () => string[],
  {
    refreshCookies = autoRefreshCookies,
    exec = execFileAsync,
    ...options
  }: ExecFileOptions & {
    refreshCookies?: () => Promise<boolean>
    /** Injectable for tests. */
    exec?: typeof execFileAsync
  } = {}
): Promise<{ stdout: string; stderr: string }> {
  const run = async () => {
    const { stdout, stderr } = await exec(getYtDlpPath(), buildArgs(), {
      maxBuffer: 32 * 1024 * 1024,
      ...options,
      encoding: 'utf-8'
    })
    return { stdout: String(stdout), stderr: String(stderr) }
  }

  try {
    return await run()
  } catch (err: unknown) {
    if (!isCookieRefreshable(getStderr(err))) throw err
    if (!(await refreshCookies())) throw err
    console.info('[yt-dlp] retrying after automatic cookie refresh')
    return await run()
  }
}

/** Longest we will hold a request waiting for a stream URL to activate. */
export const MAX_AVAILABILITY_WAIT_MS = 30_000

/**
 * YouTube stream URLs now carry an `available_at` time (unix seconds): until
 * then googlevideo answers 403. yt-dlp waits for it when it downloads, but we
 * hand the URL to the browser, so we have to wait for it ourselves.
 */
export async function waitUntilAvailable(
  meta: { available_at?: unknown },
  now = Date.now()
): Promise<number> {
  const availableAt = Number(meta.available_at)
  if (!Number.isFinite(availableAt) || availableAt <= 0) return 0
  const waitMs = Math.min(
    Math.max(0, availableAt * 1000 - now + 250),
    MAX_AVAILABILITY_WAIT_MS
  )
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs))
  return waitMs
}
