/* ============================================
   KROWD GUIDE Service Worker v7.1.0
   Three-Tier Caching Strategy
   ============================================ */

const VERSION = '7.1.0';
const CACHE_PREFIX = 'krowd-guide';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${VERSION}`;
const TILE_CACHE = `${CACHE_PREFIX}-tiles-v${VERSION}`;

// Static assets to precache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html'
];

// External assets (best-effort caching)
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap',
    'https://unpkg.com/gsap@3.12.5/dist/gsap.min.js',
    'https://unpkg.com/gsap@3.12.5/dist/Draggable.min.js',
    'https://unpkg.com/gsap@3.12.5/dist/InertiaPlugin.min.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js'
];

// API patterns to cache with network-first strategy
const API_PATTERNS = [
    'overpass-api.de',
    'api.open-meteo.com',
    'nominatim.openstreetmap.org'
];

// Tile patterns to cache with stale-while-revalidate
const TILE_PATTERNS = [
    'basemaps.cartocdn.com',
    'tile.openstreetmap.org'
];

// Cache expiration times
const CACHE_EXPIRATION = {
    api: 30 * 60 * 1000,      // 30 minutes
    tiles: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// Install event - precache static assets
self.addEventListener('install', event => {
    console.log(`[SW] Installing v${VERSION}`);
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                // Precache critical assets
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Best-effort cache external assets
                return caches.open(STATIC_CACHE).then(cache => {
                    return Promise.allSettled(
                        EXTERNAL_ASSETS.map(url => 
                            fetch(url, { mode: 'cors' })
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                })
                                .catch(() => {})
                        )
                    );
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log(`[SW] Activating v${VERSION}`);
    
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => {
                        return key.startsWith(CACHE_PREFIX) && !key.includes(VERSION);
                    }).map(key => {
                        console.log(`[SW] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - route requests to appropriate strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    // Route to appropriate caching strategy
    if (API_PATTERNS.some(pattern => url.hostname.includes(pattern))) {
        // Network-first for API requests
        event.respondWith(networkFirst(request, API_CACHE, CACHE_EXPIRATION.api));
    } else if (TILE_PATTERNS.some(pattern => url.hostname.includes(pattern))) {
        // Stale-while-revalidate for map tiles
        event.respondWith(staleWhileRevalidate(request, TILE_CACHE));
    } else if (url.origin === self.location.origin) {
        // Cache-first for same-origin static assets
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else {
        // Stale-while-revalidate for other requests
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }

        const response = await fetch(request);
        
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Cache-first error:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const cache = await caches.open(STATIC_CACHE);
            return cache.match('/offline.html');
        }
        
        throw error;
    }
}

// Network-first strategy (for API requests)
async function networkFirst(request, cacheName, maxAge) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const cache = await caches.open(cacheName);
            const responseToCache = response.clone();
            
            // Add timestamp header for expiration check
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const timedResponse = new Response(await responseToCache.blob(), {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers
            });
            
            cache.put(request, timedResponse);
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);

        if (cached) {
            const cacheTime = parseInt(cached.headers.get('sw-cache-time') || '0');
            const age = Date.now() - cacheTime;
            
            // Return cached if within max age
            if (age < maxAge) {
                return cached;
            }
        }

        // Return offline page for navigation
        if (request.mode === 'navigate') {
            const staticCache = await caches.open(STATIC_CACHE);
            return staticCache.match('/offline.html');
        }

        throw error;
    }
}

// Stale-while-revalidate strategy (for tiles and external resources)
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Start network fetch in background
    const networkPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Return cached immediately if available
    if (cached) {
        return cached;
    }

    // Otherwise wait for network
    try {
        const response = await networkPromise;
        if (response) return response;
    } catch (error) {
        console.error('[SW] SWR error:', error);
    }

    // Fallback for navigation
    if (request.mode === 'navigate') {
        return cache.match('/offline.html');
    }

    return new Response('Offline', { status: 503 });
}

// Push notification handler
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'KROWD GUIDE', {
            body: data.body || 'New update available',
            icon: data.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100],
            tag: data.tag || 'krowd-notification',
            data: { url: data.url || '/' }
        })
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                return clients.openWindow(url);
            })
    );
});

// Message handler for cache management
self.addEventListener('message', event => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'skipWaiting':
            self.skipWaiting();
            break;

        case 'clearCache':
            caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key));
            });
            break;

        case 'getVersion':
            event.ports[0]?.postMessage({ version: VERSION });
            break;

        case 'cacheUrls':
            if (payload?.urls) {
                caches.open(STATIC_CACHE).then(cache => {
                    cache.addAll(payload.urls);
                });
            }
            break;
    }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Placeholder for background sync implementation
    console.log('[SW] Background sync triggered');
}

console.log(`[SW] KROWD GUIDE Service Worker v${VERSION} loaded`);
