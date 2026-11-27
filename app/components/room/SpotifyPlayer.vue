<template>
  <RoomPlayerCard
    v-if="show"
    :title="track.name"
    :subtitle="track.artists.map((a) => a.name).join(', ')"
    :image="track.album.images[0]?.url"
    source="spotify"
    :is-playing="!paused"
    :current-time="position / 1000"
    :duration="duration / 1000"
    :volume="spotifyPlayer.volume.value"
    can-skip
    controllable
    @toggle="$emit('toggle')"
    @skip="$emit('skip')"
    @seek="(s: number) => $emit('seek', Math.round(s * 1000))"
    @volume="(v: number) => spotifyPlayer.setVolume(v)"
    @mute="toggleMute"
  />
</template>

<script lang="ts" setup>
const spotifyPlayer = useSpotifyPlayer()

defineProps<{
  show: boolean
  track: {
    name: string
    album: { images: Array<{ url: string }> }
    artists: Array<{ name: string }>
  }
  paused: boolean
  /** Milliseconds. */
  position: number
  /** Milliseconds. */
  duration: number
}>()

defineEmits<{
  toggle: []
  skip: []
  seek: [ms: number]
}>()

function toggleMute() {
  const prev = spotifyPlayer.volume.value
  spotifyPlayer.setVolume(prev === 0 ? 1 : 0)
}
</script>
