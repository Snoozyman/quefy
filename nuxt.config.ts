// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'

const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@vite-pwa/nuxt'],

  devtools: {
    enabled: true
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico'
        },
        {
          rel: 'manifest',
          href: '/manifest.webmanifest'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
    '/app/**': { ssr: false }
  },

  runtimeConfig: {
    public: {
      appVersion: '0.1.0',
      commitHash
    }
  },

  compatibilityDate: '2025-01-15',
  nitro: {
    experimental: {
      websocket: true
    }
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Quefy',
      short_name: 'Quefy',
      description: 'Multi-user YouTube audio streaming rooms',
      theme_color: '#09090b',
      background_color: '#09090b',
      display: 'standalone',
      scope: '/app',
      start_url: '/app/overview',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallbackDenylist: [/^\/api\//, /\?.*$/]
    }
  }
})
