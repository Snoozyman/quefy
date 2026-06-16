<template>
  <div>
    <UDashboardGroup class="mt-16">
      <UDashboardSidebar
        collapsible
        resizable
        :ui="{ footer: 'border-t border-default' }"
      >
        <template #header="{ collapsed }">
          <h2 v-if="!collapsed" class="grow shrink">Dashboard</h2>
          <UDashboardSidebarCollapse />
        </template>
        <UNavigationMenu orientation="vertical" :items="items" />
      </UDashboardSidebar>
      <UDashboardPanel>
        <NuxtPage />
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Overview",
    to: "/app/overview",
    icon: "i-lucide-home",
  },
  {
    label: "Room",
    to: "/app/room",
    icon: "i-lucide-users",
  },
]);
</script>

<style></style>
