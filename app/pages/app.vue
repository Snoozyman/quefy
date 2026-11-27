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
          <NuxtLink
            v-if="!collapsed"
            to="/"
            class="flex min-w-0 items-center gap-2"
            aria-label="Quefy home"
          >
            <AppLogo class="size-7 shrink-0" />
            <span class="truncate font-semibold text-highlighted">Quefy</span>
          </NuxtLink>
          <UDashboardSidebarCollapse
            :class="collapsed ? 'mx-auto' : 'ml-auto'"
          />
        </template>

        <UNavigationMenu orientation="vertical" :items="items" />

        <template #footer="{ collapsed }">
          <p v-if="!collapsed" class="text-xs text-muted px-3 py-2">
            v{{ appVersion }} ({{ commitHash }})
          </p>
        </template>
      </UDashboardSidebar>
      <UDashboardPanel>
        <UDashboardNavbar :title="pageTitle">
          <template #right>
            <UColorModeButton />
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

const route = useRoute()
const pageTitle = computed(() => {
  if (route.path.startsWith('/app/room/')) return 'Room'
  if (route.path.startsWith('/app/room')) return 'Join or create'
  return 'Overview'
})

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Overview',
    to: '/app/overview',
    icon: 'i-lucide-home'
  },
  {
    label: 'Join or create',
    to: '/app/room',
    icon: 'i-lucide-users'
  }
])
</script>

<style></style>
