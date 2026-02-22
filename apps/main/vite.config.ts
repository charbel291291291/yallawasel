import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// LUXURY CUSTOMER CONFIGURATION
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globIgnores: [
          '**/charts-*.js',
          '**/AdminPanel-*.js',
          '**/vendor-*.js',
          '**/SmartKitBuilder-*.js',
          '**/*View-*.js',
          '**/FleetDashboard-*.js',
          '**/firebase-*.js',
          '**/motion-*.js',
          '**/ai-vendor-*.js'
        ],
        cacheId: 'yalla-main-v1',
        cleanupOutdatedCaches: true
      },
      manifest: {
        id: 'yalla-main-v1',
        name: 'Yalla Wasel',
        short_name: 'YW',
        description: 'Elite Deliveries and Curated Kits',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/main-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/main-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false
  },
  clearScreen: false
})
