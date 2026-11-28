import { dirname, join } from 'node:path'

/**
 * Where Quefy keeps runtime data (saved rooms). `DATA_DIR` wins; otherwise
 * the folder of `YT_DLP_COOKIES`, because the Unraid template mounts its
 * volume at /data and points the cookie file there; otherwise ./data, which
 * docker-compose mounts.
 */
export function dataDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.DATA_DIR) return env.DATA_DIR
  if (env.YT_DLP_COOKIES) return dirname(env.YT_DLP_COOKIES)
  return join(process.cwd(), 'data')
}
