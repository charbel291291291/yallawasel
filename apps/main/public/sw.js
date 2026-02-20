const CACHE_NAME = "yalla-main-v1.1";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/logo.png",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

// Force update when message received from UI
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== "basic") return response;
                const toCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
                return response;
            });
            return cached || networkFetch;
        })
    );
});
