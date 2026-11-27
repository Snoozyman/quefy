import { expect, test } from 'bun:test'
import { runYtDlp as run } from '../server/utils/yt-dlp'

const calls: string[][] = []
let failuresLeft = 0
let failureStderr = ''

// Stands in for promisify(execFile), which resolves { stdout, stderr }.
const exec = (async (_file: string, args: readonly string[]) => {
  calls.push([...args])
  if (failuresLeft-- > 0) {
    throw Object.assign(new Error('yt-dlp failed'), { stderr: failureStderr })
  }
  return { stdout: 'ok', stderr: '' }
}) as unknown as NonNullable<Parameters<typeof run>[1]>['exec']

let refreshResult = true
let refreshes = 0
const refreshCookies = async () => {
  refreshes++
  return refreshResult
}

const runYtDlp: typeof run = (buildArgs, options) =>
  run(buildArgs, { exec, ...options })

function reset(failures: number, stderr: string, refreshOk = true) {
  calls.length = 0
  refreshes = 0
  failuresLeft = failures
  failureStderr = stderr
  refreshResult = refreshOk
}

test('retries once after refreshing cookies on a bot check', async () => {
  reset(1, "Sign in to confirm you're not a bot")
  let attempt = 0
  const res = await runYtDlp(() => [`attempt-${++attempt}`], { refreshCookies })
  expect(res.stdout).toBe('ok')
  expect(refreshes).toBe(1)
  // args are rebuilt per attempt so new cookie args are picked up
  expect(calls).toEqual([['attempt-1'], ['attempt-2']])
})

test('does not refresh for account-gated errors', async () => {
  reset(1, 'Sign in to confirm your age')
  await expect(runYtDlp(() => ['x'], { refreshCookies })).rejects.toThrow('yt-dlp failed')
  expect(refreshes).toBe(0)
  expect(calls).toHaveLength(1)
})

test('skips the retry when the refresh changed nothing', async () => {
  reset(1, 'HTTP Error 403: Forbidden', false)
  await expect(runYtDlp(() => ['x'], { refreshCookies })).rejects.toThrow('yt-dlp failed')
  expect(refreshes).toBe(1)
  expect(calls).toHaveLength(1)
})

test('retries only once', async () => {
  reset(2, 'HTTP Error 403: Forbidden')
  await expect(runYtDlp(() => ['x'], { refreshCookies })).rejects.toThrow('yt-dlp failed')
  expect(calls).toHaveLength(2)
})
