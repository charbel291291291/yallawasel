# PWA Caching & Update Strategy

## 1. Overview
This document outlines the caching strategy implemented to ensure **Yalla Wasel** updates automatically, reliably, and without requiring hard refreshes.

## 2. Core Configuration (Vite PWA)
We utilize `vite-plugin-pwa` with specific hardening for immediate updates:

- **Strategy**: `generateSW` (Auto-generated Service Worker)
- **Register Type**: `autoUpdate` (Updates install and activate immediately)
- **Navigation Fallback**: `index.html` (Ensures SPA routing works offline)

### Key Settings
```typescript
workbox: {
  cleanupOutdatedCaches: true, // Nukes old versions automatically
  clientsClaim: true,          // New SW controls page immediately
  skipWaiting: true,           // Skips the "waiting" phase
}
```

## 3. Caching Layers

### Layer A: Browser Cache (HTTP Headers)
- **index.html**: `no-cache, no-store, must-revalidate` (Meta tags enforced). This ensures the browser ALWAYS checks for a new Service Worker reference.
- **Assets (JS/CSS)**: Hashed filenames (`assets/[name]-[hash].js`) allow infinite caching since the URL changes on every deploy.

### Layer B: Service Worker (Workbox)
1.  **Stale-While-Revalidate**: Used for fonts and images.
2.  **Network-First**: Used for all API calls (`supabase.co`) to ensure fresh data.
    - Timeout: 10 seconds
    - Fallback: Cached data if offline

## 4. Update Lifecycle
1.  **Deploy**: You push new code.
2.  **User Visit**: Browser fetches `index.html` (no-cache) -> sees new `sw.js`.
3.  **Install**: Browser installs new `sw.js` in background.
4.  **Activate**: `skipWaiting: true` fires -> New SW takes over.
5.  **Refresh**: `clientsClaim: true` fires -> Page reloads automatically with new version.

## 5. Troubleshooting
If a user is stuck on an old version (from before this fix):
- The new `ReloadPrompt` component is now embedded in the app.
- It will detect the update and show a prompt or auto-reload depending on state.
- A **manual hard refresh** (Ctrl+F5) might be needed ANYWAY one last time to load this new logic.

## 6. Verification
To verify the fix:
1.  Build project: `npm run build`
2.  Serve `dist/`: `npx serve dist`
3.  Open in Incognito.
4.  Make a visible change (e.g., change title in `index.html`).
5.  Rebuild & Restart server.
6.  Refresh page -> New title should appear instantly without clearing cache.
