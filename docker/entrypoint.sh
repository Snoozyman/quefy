#!/bin/sh
# Container start, as root: update yt-dlp, hand the data folders to the app
# user, then drop privileges and start the server as that user.
#
#   PUID / PGID          user and group to run as (default 1000; Unraid: 99/100)
#   YT_DLP_AUTO_UPDATE   set to "false" to keep the yt-dlp baked into the image
set -e

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

if [ "$(id -u)" != "0" ]; then
  # Started with --user: nothing to set up, run as given.
  exec "$@"
fi

if [ "${YT_DLP_AUTO_UPDATE:-true}" != "false" ]; then
  # YouTube changes break yt-dlp every few weeks; an update usually fixes it.
  echo "[entrypoint] updating yt-dlp ($(yt-dlp --version))..."
  timeout 60 yt-dlp -U || echo "[entrypoint] yt-dlp update failed; keeping $(yt-dlp --version)"
fi

cookie_dir=""
if [ -n "${YT_DLP_COOKIES:-}" ]; then
  cookie_dir="$(dirname "$YT_DLP_COOKIES")"
fi

# Folders the app writes to. Files an older (root) container created there
# become writable again.
for dir in /app/data "${DATA_DIR:-}" "$cookie_dir" "$HOME"; do
  [ -n "$dir" ] || continue
  mkdir -p "$dir"
  chown -R "$PUID:$PGID" "$dir" 2>/dev/null ||
    echo "[entrypoint] could not give $dir to $PUID:$PGID (read-only mount?)"
done

exec setpriv --reuid="$PUID" --regid="$PGID" --clear-groups "$@"
