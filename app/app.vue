<script setup>
useHead({
  htmlAttrs: {
    lang: "en",
  },
});

const title = "Quefy";
const description =
  "Quefy is a queue for Youtube music for everyone. Create a room, share the link and enjoy music together with your friends.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "https://quefy.app/og-image.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp>
    <Header />

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Built with Nuxt UI • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/nuxt-ui-templates/starter"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
