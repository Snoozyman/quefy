import { getCookieInfo } from '#server/utils/cookies'

export default defineEventHandler(() => {
  return getCookieInfo()
})
