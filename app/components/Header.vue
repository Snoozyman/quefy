<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu :items="items" />
    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
    <template #right>
      <UButton
        to="https://github.com/Snoozyman/quefy"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
      <UColorModeButton />
    </template>
  </UHeader>
</template>

<script lang="ts" setup>
const items = [
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'App',
    to: '/app'
  }
]
</script>
