export function parseYtDlpError(stderr: string): string {
  const lower = stderr.toLowerCase();

  if (
    lower.includes("sign in to confirm your age") ||
    lower.includes("age-restricted")
  ) {
    return "This video is age-restricted. Configure YT_DLP_COOKIES with authenticated YouTube cookies to access it.";
  }

  if (
    lower.includes("only available to members") ||
    lower.includes("member-only")
  ) {
    return "This video is members-only. Configure YT_DLP_COOKIES with authenticated YouTube cookies to access it.";
  }

  if (lower.includes("private video")) {
    return "This video is private. Configure YT_DLP_COOKIES with authenticated YouTube cookies to access it.";
  }

  if (
    lower.includes("video unavailable") ||
    lower.includes("no video formats found")
  ) {
    return "This video is unavailable or has been removed.";
  }

  if (lower.includes("http error 403") || lower.includes("forbidden")) {
    return "Access denied (403). The video may require authentication. Configure YT_DLP_COOKIES with YouTube cookies.";
  }

  if (lower.includes("unable to download") || lower.includes("network error")) {
    return "Network error while fetching video. Check your connection and try again.";
  }

  return "Failed to process video. The video may be unavailable or require authentication.";
}
