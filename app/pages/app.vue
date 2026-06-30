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

        <UNavigationMenu
          orientation="vertical"
          :items="items"
        />

        <template #footer="{ collapsed }">
          <p
            v-if="!collapsed"
            class="text-xs text-muted px-3 py-2"
          >
            v{{ appVersion }} ({{ commitHash }})
          </p>
        </template>
      </UDashboardSidebar>
      <UDashboardPanel>
        <UDashboardNavbar title="Dashboard">
          <template #right>
            <UButton
              to="https://github.com/Snoozyman/quefy"
              target="_blank"
              icon="i-simple-icons-github"
              aria-label="GitHub"
              color="neutral"
              variant="ghost"
            />
          </template>
        </UDashboardNavbar>

        <NuxtPage />
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const { appVersion, commitHash } = useRuntimeConfig().public

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Overview',
    to: '/app/overview',
    icon: 'i-lucide-home'
  },
  {
    label: 'Room',
    to: '/app/room',
    icon: 'i-lucide-users'
  }
])
</script>

<style></style>
