import type { SongData } from '#shared/types/room'

/** "Artist A, Artist B" when known, else "Added by <name>". */
export function songSubtitle(song: SongData | null | undefined): string {
  if (!song) return ''
  if (song.artists?.length) return song.artists.join(', ')
  return song.addedBy ? `Added by ${song.addedBy}` : ''
}
