<template>
  <UPage>
    <UPageHero
      title="One queue for the whole room."
      description="Start a room, share the 4-letter code, and everyone adds songs from YouTube, Spotify and SoundCloud from their own phone. The host's speakers play it. No accounts needed."
    >
      <template #links>
        <UButton to="/app/room" size="xl" trailing-icon="i-lucide-arrow-right">
          Create a room
        </UButton>
        <UButton
          to="/app/room"
          size="xl"
          color="neutral"
          variant="subtle"
          trailing-icon="i-lucide-log-in"
        >
          Join with a code
        </UButton>
      </template>

      <LandingRoomPreview />
    </UPageHero>

    <UPageSection
      headline="Features"
      title="Built for the group, run by the host"
      description="Real-time updates, three music sources, and nothing to install."
    >
      <template #features>
        <UPageFeature
          icon="i-lucide-radio-tower"
          title="Live for everyone"
          description="The queue and what's playing update instantly on every phone in the room. Only the host's device plays audio."
        />
        <UPageFeature
          icon="i-lucide-music-2"
          title="YouTube, Spotify & SoundCloud"
          description="Mix all three in one queue. The player switches source automatically from one song to the next."
        />
        <UPageFeature
          icon="i-lucide-users"
          title="Join with a code"
          description="No signup. Share the 4-letter code or an invite link and anyone can join from any device."
        />
        <UPageFeature
          icon="i-lucide-list-music"
          title="Collaborative queue"
          description="Guests add songs; the host can reorder, remove and skip. Everyone contributes, the host stays in control."
        />
        <UPageFeature
          icon="i-lucide-smartphone"
          title="Install it like an app"
          description="Add Quefy to your home screen for a full-screen player with lock-screen controls."
        />
        <UPageFeature
          icon="i-lucide-server"
          title="Self-hosted & open source"
          description="Run it on your own machine or server with Docker. MIT licensed."
        />
      </template>
    </UPageSection>

    <UPageSection
      headline="How it works"
      title="Three steps to start listening"
      description="Get a room going in under 30 seconds."
    >
      <template #features>
        <UPageFeature
          icon="i-lucide-plus-circle"
          title="1. Create a room"
          description="Click “Create a room” and you're the host. Share the code or invite link with your friends."
        />
        <UPageFeature
          icon="i-lucide-search"
          title="2. Add songs"
          description="Anyone in the room can search YouTube, Spotify or SoundCloud, or paste a link, to add to the queue."
        />
        <UPageFeature
          icon="i-lucide-play"
          title="3. Press play"
          description="The host's device plays the queue. Everyone sees what's on and what's up next, live."
        />
      </template>
    </UPageSection>

    <UPageCTA
      title="Ready to listen together?"
      description="Create your first room and invite your friends. It's free, open source, and takes seconds."
      variant="subtle"
    >
      <template #links>
        <UButton to="/app/room" size="xl" trailing-icon="i-lucide-arrow-right">
          Create a room
        </UButton>
        <UButton
          to="https://github.com/Snoozyman/quefy"
          target="_blank"
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-simple-icons-github"
        >
          View on GitHub
        </UButton>
      </template>
    </UPageCTA>
  </UPage>
</template>
