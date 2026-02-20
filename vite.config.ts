import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: "/",
    server: {
      port: 3001,
      strictPort: false,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate", // Forces immediate update when new content is found
        includeAssets: ["icons/favicon.png", "icons/icon-512x512.png", "icons/icon-maskable-512.png"],
        manifest: false, // Managed externally or via separate file
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          cleanupOutdatedCaches: true, // Delete old caches automatically
          clientsClaim: true, // Take control of open pages immediately
          skipWaiting: true, // Activate new SW immediately
          navigateFallback: "index.html", // SPA fallback
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              // Supabase / API calls - Network First to ensure fresh data
              urlPattern: ({ url }) => url.href.includes('supabase.co'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes cache for API
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
    ],
    define: {
      "process.env.VITE_API_KEY": JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY),
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      minify: "terser",
      chunkSizeWarningLimit: 600, // AdminPanel is lazy-loaded, 574KB uncompressed is acceptable
      emptyOutDir: true, // Ensure old files are removed
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          driver: path.resolve(__dirname, 'driver.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('firebase')) return 'vendor-firebase';
            }
          }
        },
      },
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
