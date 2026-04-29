
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
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. TAHAP FETCH: Mencegat request dengan strategi yang tepat
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Untuk request ke API (data dinamis): gunakan Network First
    // Agar data terbaru selalu diambil dari server, cache hanya untuk offline
    if (url.includes('api_toko')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Simpan salinan response terbaru ke cache untuk mode offline
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Jika offline, ambil dari cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Untuk file statis (HTML, JS, CSS): gunakan Cache First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) { return response; }
                return fetch(event.request);
            })
    );
});