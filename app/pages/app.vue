<template>
  <div>
    <UDashboardGroup>
      <UDashboardSidebar
        collapsible
        resizable
        mode="slideover"
        :ui="{ footer: 'border-t border-default' }"
      >
        <template #header="{ collapsed }">
          <UDashboardSidebarCollapse />
        </template>

        <UNavigationMenu orientation="vertical" :items="items" />
      </UDashboardSidebar>
      <UDashboardPanel>
        <UDashboardNavbar title="Dashboard" />

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
