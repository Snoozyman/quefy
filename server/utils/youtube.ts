import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { parseYtDlpError } from "./yt-dlp-errors";

const execFileAsync = promisify(execFile);

interface AudioStream {
  url: string;
  mimeType: string;
  contentLength: string;
  audioQuality: string;
  itag: number;
  title: string;
}

const cache = new Map<string, { data: AudioStream; ts: number }>();
const CACHE_TTL = 3_600_000;

function getCookiesArgs(): string[] {
  const cookiesPath = process.env.YT_DLP_COOKIES;
  if (cookiesPath && existsSync(cookiesPath)) {
    return ["--cookies", cookiesPath];
  }
  return [];
}

export async function getAudioStreamUrl(videoId: string): Promise<AudioStream> {
  const cached = cache.get(videoId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  let stdout: string;
  let stderr: string;
  try {
    const result = await execFileAsync("yt-dlp", [
      "-f",
      "bestaudio",
      "--print-json",
      "--print",
      "url",
      ...getCookiesArgs(),
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err: any) {
    stderr = err.stderr || "";
    throw new Error(parseYtDlpError(stderr));
  }

  const lines = stdout.trim().split("\n");
  const url = lines[0]!;
  const meta = JSON.parse(lines[1]!);

  if (!url) throw new Error("No audio URL returned from yt-dlp");

  const data: AudioStream = {
    url,
    mimeType: meta.ext ? `audio/${meta.ext}` : "audio/webm",
    contentLength: String(meta.filesize ?? meta.filesize_approx ?? 0),
    audioQuality: meta.quality ?? "",
    itag: meta.format_id ?? 0,
    title: meta.title ?? "",
  };

  cache.set(videoId, { data, ts: Date.now() });
  return data;
}
