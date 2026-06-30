<template>
  <UPage>
    <UPageHero
      title="Listen together. In sync."
      description="Multi-user YouTube and Spotify audio rooms. Share a queue, control playback together, and discover music with friends — no account needed."
    >
      <template #links>
        <UButton to="/app/room" size="xl" trailing-icon="i-lucide-arrow-right">
          Create a Room
        </UButton>
        <UButton
          to="https://github.com/anomalyco/quefy"
          target="_blank"
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-simple-icons-github"
        >
          View on GitHub
        </UButton>
      </template>
    </UPageHero>

    <UPageSection
      headline="Features"
      title="Everything you need to share the experience"
      description="Real-time sync, dual-platform support, and a simple interface built for groups."
    >
      <template #features>
        <UPageFeature
          icon="i-lucide-waves"
          title="Real-time sync"
          description="Queue updates stream to every listener instantly via SSE. No polling, no lag — everyone hears the same song at the same time."
        />
        <UPageFeature
          icon="i-lucide-music-2"
          title="YouTube & Spotify"
          description="Search and queue from both platforms. The player switches automatically — add a YouTube track next to a Spotify song and it just works."
        />
        <UPageFeature
          icon="i-lucide-users"
          title="Share a room code"
          description="No signup required. Create a room, share the 4-letter code, and anyone can join from any device. In and out in seconds."
        />
        <UPageFeature
          icon="i-lucide-list-music"
          title="Collaborative queue"
          description="Everyone adds, removes, and reorders songs. Vote on what plays next or let the queue run — full control for the whole group."
        />
      </template>
    </UPageSection>

    <UPageSection
      headline="How it works"
      title="Three steps to start listening"
      description="Get a room going in under 30 seconds."
      orientation="horizontal"
      reverse
    >
      <template #features>
        <UPageFeature
          icon="i-lucide-plus-circle"
          title="1. Create a room"
          description="Hit 'New Room' and share the code with friends. No accounts, no passwords."
        />
        <UPageFeature
          icon="i-lucide-search"
          title="2. Add songs"
          description="Search YouTube or Spotify, pick a track, and drop it in the queue."
        />
        <UPageFeature
          icon="i-lucide-play"
          title="3. Play together"
          description="Press play. Everyone in the room hears the same thing, synced in real time."
        />
      </template>
    </UPageSection>

    <UPageCTA
      title="Ready to listen together?"
      description="Create your first room and invite your friends. It's free, open source, and takes seconds."
    >
      <template #links>
        <UButton to="/app/room" size="xl" trailing-icon="i-lucide-arrow-right">
          Create a Room
        </UButton>
        <UButton
          to="/app/room"
          size="xl"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-log-in"
        >
          Join a Room
        </UButton>
      </template>
    </UPageCTA>
  </UPage>
</template>
