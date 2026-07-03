<script setup>
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Quefy'
const description =
  'Quefy is a queue for Youtube music for everyone. Create a room, share the link and enjoy music together with your friends.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://quefy.app/og-image.png',
  twitterCard: 'summary_large_image'
})

const route = useRoute()
const isApp = computed(() => route.path.startsWith('/app'))
</script>

<template>
  <UApp>
    <Header v-if="!isApp" />

    <UMain v-if="!isApp">
      <NuxtPage />
    </UMain>
    <UMain v-else>
      <NuxtPage />
    </UMain>

    <template v-if="!isApp">
      <UFooter>
        <template #left>
          <p class="text-sm text-muted">Quefy &middot; MIT License</p>
        </template>
        <template #right>
          <UButton
            to="https://github.com/Snoozyman/quefy"
            target="_blank"
            variant="ghost"
            color="neutral"
            icon="i-simple-icons-github"
          />
        </template>
      </UFooter>
    </template>
  </UApp>
</template>
