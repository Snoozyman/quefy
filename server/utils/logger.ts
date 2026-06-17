export function logRequest(event: { path?: string; method?: string }, ...args: unknown[]) {
  console.log(`[${new Date().toISOString()}] ${event.method ?? '?'} ${event.path ?? '?'}`, ...args)
}

export function logError(event: { path?: string; method?: string }, ...args: unknown[]) {
  console.error(`[${new Date().toISOString()}] ${event.method ?? '?'} ${event.path ?? '?'}`, ...args)
}