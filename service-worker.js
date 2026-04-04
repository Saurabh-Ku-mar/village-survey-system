const CACHE_NAME = 'village-survey-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/dashboard.html',
    '/style.css',
    '/app.js',
    '/db.js',
    '/pdf.js',
    '/auth.js',
    '/manifest.json'
];

// Install event - cache all assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching assets');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('[Service Worker] Cache error (some assets may not be available offline)', err);
                // Don't fail installation if some assets can't be cached
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle different request types
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request).then(response => {
                if (response) {
                    console.log('[Service Worker] Serving from cache:', request.url);
                    return response;
                }

                console.log('[Service Worker] Fetching from network:', request.url);
                return fetch(request).then(networkResponse => {
                    // Cache successful responses
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'error') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(error => {
                    console.log('[Service Worker] Fetch failed, serving offline page:', error);
                    // Return offline page or cached response
                    return caches.match(request).then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline page for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        throw new Error('No offline response available');
                    });
                });
            })
        );
    }
});

// Background sync (for future offline data sync)
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync event:', event.tag);
    if (event.tag === 'sync-survey-data') {
        event.waitUntil(
            // Sync logic here (currently not needed as we use IndexedDB)
            Promise.resolve()
        );
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('[Service Worker] Push notification received');
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        tag: 'village-survey-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Village Survey System', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if app is already open
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if not open
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Message handler for communication with app
self.addEventListener('message', event => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        calculateCacheSize().then(size => {
            event.ports[0].postMessage({
                type: 'CACHE_SIZE',
                size: size
            });
        });
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearCache().then(() => {
            event.ports[0].postMessage({
                type: 'CACHE_CLEARED'
            });
        });
    }
});

// Helper function to calculate cache size
async function calculateCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }

    return totalSize;
}

// Helper function to clear cache
async function clearCache() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(name => caches.delete(name))
    );
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
    console.log('[Service Worker] Periodic sync:', event.tag);
    if (event.tag === 'update-data') {
        event.waitUntil(
            // Update logic here
            Promise.resolve()
        );
    }
});

console.log('[Service Worker] Service Worker script loaded');
