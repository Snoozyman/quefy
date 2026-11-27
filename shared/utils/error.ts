interface ErrorLike {
  message?: unknown
  statusMessage?: unknown
  data?: { statusMessage?: unknown; message?: unknown } | null
}

function pick(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v) return v
  }
  return ''
}

/**
 * Extract a human-readable message from an unknown error, including
 * `$fetch` errors where the server message lives in `data.statusMessage`.
 */
export function errorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (typeof err === 'string') return err || fallback
  if (err && typeof err === 'object') {
    const e = err as ErrorLike
    return (
      pick(
        e.data?.statusMessage,
        e.statusMessage,
        e.data?.message,
        e.message
      ) || fallback
    )
  }
  return fallback
}
