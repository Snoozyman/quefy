<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
    </template>
  </UHeader>
</template>

<script lang="ts" setup>
const items = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "App",
    to: "/app",
  },
];
</script>
