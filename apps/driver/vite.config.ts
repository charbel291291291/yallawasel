import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * PRODUCTION PWA ARCHITECTURE - DRIVER TERMINAL
 * Hardened configuration for standalone mobile deployment.
 */
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
            manifest: false, // We use the existing public/manifest.json for source of truth
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                    'ui-vendor': ['zustand'],
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
    clearScreen: false
})
