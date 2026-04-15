const CACHE_VERSION = 'sila-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        console.warn('[SW] Some assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (let them fail gracefully in app)
  if (url.pathname.includes('/api/') || url.pathname.includes('/functions/')) {
    return;
  }

  // Stale-while-revalidate for HTML
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Network first for static assets (CSS, JS, images)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        }
        return caches.match(request) || response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return (
            cachedResponse ||
            new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          );
        });
      })
  );
});

// Message handler for cache control
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'CLEAR_CACHE') {
    caches.delete(CACHE_VERSION).then(() => {
      console.log('[SW] Cache cleared');
    });
  }

  if (type === 'CACHE_URLS') {
    caches.open(CACHE_VERSION).then((cache) => {
      cache.addAll(payload.urls).catch(() => {
        console.warn('[SW] Some URLs failed to cache');
      });
    });
  }
});
