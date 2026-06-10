const CACHE_NAME = "toko-pwa-v5";
const urlsToCache = [
  "./",
  "index.html",
  "app.js",
  "icons/image.png",
];

// 1. INSTALL: cache aset penting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Membuka cache:", CACHE_NAME);
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn("Beberapa asset gagal dicache:", err);
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// 2. ACTIVATE: hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("Menghapus cache lama:", name);
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. FETCH: network-first untuk API, cache-first untuk aset statis
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  // Abaikan manifest.json agar langsung dilayani oleh browser (memakai cookie keamanan __test)
  if (requestUrl.pathname.endsWith("manifest.json")) {
    return;
  }

  const isApiRequest =
    requestUrl.pathname.includes("/api_toko/") ||
    requestUrl.pathname.endsWith(".php");

  if (isApiRequest) {
    // POST/PUT/DELETE tidak bisa di-cache, langsung teruskan ke network
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }
    // GET: network-first, simpan ke cache sebagai fallback offline
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((resp) => resp || caches.match("index.html")),
        ),
    );
    return;
  }

  // navigasi (SPA-like): coba network lalu fallback ke cached index
  if (event.request.mode === "navigate" && isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match("index.html")),
    );
    return;
  }

  // default: cache-first untuk aset statis
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "error"
          )
            return networkResponse;
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseClone);
            } catch (e) {
              /* opaque responses may fail to cache */
            }
          });
          return networkResponse;
        })
        .catch(() => caches.match("index.html"));
    }),
  );
});
