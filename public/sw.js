const CACHE_NAME = 'farmiq-v4';
const STATIC_MEDIA = [
  '/manifest.json',
  '/farmiq-logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_MEDIA).catch((err) => {
        console.warn('PWA Pre-cache media warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Purging outdated cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API routes or non-origin requests
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // HTML Navigation: Always fetch fresh HTML from the network so Vite script hashes are never stale!
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If completely offline and unable to reach server, check cache
        return caches.match('/manifest.json').then(() => {
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FarmiQ - Offline</title><style>body{background:#064e3b;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}h1{margin-bottom:8px;}button{background:#10b981;color:white;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;margin-top:16px;}</style></head><body><h1>🌾 FarmiQ Offline</h1><p>You appear to be offline or the server is waking up.</p><button onclick="location.reload()">Retry Connection</button></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // Static Assets (Hashed JS, CSS, Images): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful static media responses (not API or dynamic HTML)
        if (networkResponse && networkResponse.status === 200 && (url.pathname.startsWith('/assets/') || STATIC_MEDIA.includes(url.pathname))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
