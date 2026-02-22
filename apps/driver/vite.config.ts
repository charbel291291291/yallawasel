import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TERMINAL OPERATIONAL CONFIGURATION
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                cacheId: 'yalla-driver-v1', // Unique cache name
                cleanupOutdatedCaches: true
            },
            manifest: {
                id: 'yalla-driver-v1', // Unique manifest ID
                name: 'Yalla Wasel Driver',
                short_name: 'YW Driver',
                description: 'Operational Terminal for Elite Drivers',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: '/icons/driver-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/driver-512.png',
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
        sourcemap: false,
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                    'ui-vendor': ['zustand'],
                }
            }
        }
    },
    clearScreen: false
})
