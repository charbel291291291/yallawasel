const CACHE_NAME = 'yw-driver-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Offline Queue for Mission Critical Actions
let actionQueue = [];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Stale-while-revalidate for static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (event.request.url.startsWith(self.location.origin) && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                }
                return networkResponse;
            }).catch(() => {
                // If network fails and no cache, return offline fallback if it was a page navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
            return cachedResponse || fetchPromise;
        })
    );
});

// Background Sync for deferred actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-mission-updates') {
        event.waitUntil(syncActions());
    }
});

async function syncActions() {
    // This would process the indexedDB queue in a real production scenario
    console.log('[SW] Background Sync Triggered for Mission Uplink');
}
