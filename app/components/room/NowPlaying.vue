<template>
  <RoomPlayerCard
    :title="song?.title"
    :subtitle="songSubtitle(song)"
    :image="song?.albumImageUrl"
    :source="song?.source"
    :is-playing="isPlaying"
    :controllable="controllable"
    :can-skip="!!song"
    :toggle-disabled="toggleDisabled"
    :empty-title="emptyTitle"
    :hint="hint"
    @toggle="$emit('toggle')"
    @skip="$emit('skip')"
  />
</template>

<script lang="ts" setup>
import type { SongData } from '#shared/types/room'

/**
 * Player card without a local player: the guest view, and the host's view
 * before playback starts (or while a Spotify track waits for the SDK).
 */
defineProps<{
  song: SongData | null
  isPlaying: boolean
  controllable?: boolean
  toggleDisabled?: boolean
  emptyTitle?: string
  hint?: string
}>()

defineEmits<{
  toggle: []
  skip: []
}>()
</script>
