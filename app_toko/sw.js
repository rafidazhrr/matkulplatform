const CACHE_NAME = 'toko-pwa-v1';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './manifest.json'
];

// 1. TAHAP INSTALL: Simpan file-file penting ke Cache Browser
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Membuka cache...');
                return cache.addAll(urlsToCache).catch(() => {
                    // Jika ada URL yang gagal, cache yang bisa saja dulu
                    return cache.addAll([
                        './',
                        './index.html',
                        './app.js',
                        './manifest.json'
                    ]);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// 2. TAHAP ACTIVATE: Hapus cache lama
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. TAHAP FETCH: Mencegat request. Jika offline, ambil dari Cache!
self.addEventListener('fetch', event => {
    // Jika request ditujukan ke API (folder api_toko atau file .php), gunakan strategi network-first
    const requestUrl = new URL(event.request.url);
    const isApiRequest = requestUrl.pathname.includes('/api_toko/') || requestUrl.pathname.endsWith('.php');

    if (isApiRequest) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Cache response baru jika sukses, tapi kembalikan network response terlebih dahulu
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Jika offline, fallback ke cache jika ada
                    return caches.match(event.request).then(resp => resp || caches.match('./index.html'));
                })
        );
        return;
    }

    // Default: cache-first untuk aset statis
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                }).catch(() => {
                    return caches.match('./index.html');
                });
            })
    );
});
