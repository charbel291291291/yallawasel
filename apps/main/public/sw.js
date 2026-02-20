// Service Worker for Yalla Wasel PWA

const CACHE_NAME = "yalla-wasel-v1.0.1";
const urlsToCache = [
  "/",
  "/index.html",
  "/logo.png",
  "/icons/favicon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - handle network requests
self.addEventListener("fetch", (event) => {
  // Handle POST requests for sync operations
  if (event.request.method === "POST") {
    event.respondWith(handlePostRequest(event));
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Handle API requests with network-first strategy
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Update cache with new response
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // If network fails, try cache
            return cache.match(event.request).then((cachedResponse) => {
              return (
                cachedResponse ||
                new Response('{"error":"Offline"}', {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                })
              );
            });
          });
      })
    );
  } else {
    // Handle static assets with cache-first strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Clone the request for fetch
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Return fallback for critical assets
            if (event.request.destination === "document") {
              return caches.match("/");
            }
            return new Response("Offline", { status: 503 });
          });
      })
    );
  }
});

// Handle POST requests for sync operations
async function handlePostRequest(event) {
  try {
    // Try to send the request immediately
    const response = await fetch(event.request.clone());
    return response;
  } catch (error) {
    // If fetch fails, store the request for later sync
    const requestClone = event.request.clone();
    const payload = await requestClone.json();

    // Store the request in IndexedDB for later sync
    const queue = await getSyncQueue();
    queue.push({
      url: event.request.url,
      method: event.request.method,
      payload: payload,
      timestamp: Date.now(),
    });

    await setSyncQueue(queue);

    // Register sync event to process the queue when online
    if ("sync" in self.registration) {
      await self.registration.sync.register("sync-requests");
    }

    return new Response(
      JSON.stringify({
        queued: true,
        message: "Request queued for offline sync",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// IndexedDB helpers for sync queue
function getSyncQueue() {
  return new Promise((resolve) => {
    const dbReq = indexedDB.open("SyncDB", 1);

    dbReq.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };

    dbReq.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("queue", "readonly");
      const store = tx.objectStore("queue");
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result);
      };

      req.onerror = () => {
        resolve([]);
      };
    };

    dbReq.onerror = () => {
      resolve([]);
    };
  });
}

function setSyncQueue(queue) {
  return new Promise((resolve, reject) => {
    const dbReq = indexedDB.open("SyncDB", 1);

    dbReq.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };

    dbReq.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");

      // Clear existing queue
      store.clear().onsuccess = () => {
        // Add new items to the queue
        queue.forEach((item) => {
          store.add(item);
        });
        resolve();
      };
    };

    dbReq.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Background sync handler
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-requests") {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getSyncQueue();

  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.payload),
      });

      // Remove successfully synced item from queue
      await removeFromSyncQueue(item.id);
    } catch (error) {
      console.error("Failed to sync item:", error);
      // Keep the item in the queue for next attempt
    }
  }
}

function removeFromSyncQueue(id) {
  return new Promise((resolve, reject) => {
    const dbReq = indexedDB.open("SyncDB", 1);

    dbReq.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };

    dbReq.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");

      store.delete(id).onsuccess = () => {
        resolve();
      };
    };

    dbReq.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Push notification handler
self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  const payload = event.data ? event.data.json() : {};

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-512x512.png",
    badge: payload.badge || "/icons/icon-512x512.png",
    data: {
      url: payload.url || "/",
    },
    vibrate: [200, 100, 200],
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Yalla Wasel", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (
    event.action === "open_url" &&
    event.notification.data &&
    event.notification.data.url
  ) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  } else if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
