import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                    'ui-vendor': ['framer-motion', 'lucide-react', 'zustand'],
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
    clearScreen: false
})
