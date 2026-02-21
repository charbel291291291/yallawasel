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
            includeAssets: ['favicon.png', 'robots.txt', 'icons/*.png'],
            manifestFilename: 'manifest.json',
            manifest: {
                name: "Yalla Wasel Driver Terminal",
                short_name: "YW Driver",
                description: "Tactical Mission Control for Yalla Wasel Logistics Operators",
                start_url: "/",
                scope: "/",
                display: "standalone",
                background_color: "#0A0C14",
                theme_color: "#B9975B",
                orientation: "portrait",
                categories: ["productivity", "utilities"],
                lang: "en",
                id: "/",
                icons: [
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "/icons/icon-maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ],
                screenshots: [
                    {
                        src: "/logo.png",
                        sizes: "512x512",
                        type: "image/png",
                        form_factor: "narrow",
                        label: "Yalla Wasel Driver Interface"
                    },
                    {
                        src: "/logo.png",
                        sizes: "512x512",
                        type: "image/png",
                        form_factor: "wide",
                        label: "Tactical Mission Control"
                    }
                ],
                shortcuts: [
                    {
                        name: "Initiate Shift",
                        url: "/",
                        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }]
                    },
                    {
                        name: "Wallet Archive",
                        url: "/wallet",
                        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }]
                    }
                ]
            },
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
