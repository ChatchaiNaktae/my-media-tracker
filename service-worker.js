const CACHE_NAME = 'media-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/dropdown.js',
    '/manifest.json',
    '/Assets/Images/favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('/items') || event.request.url.includes('/login') || event.request.url.includes('/register')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // ถ้ามีไฟล์ใน Cache ให้ใช้ Cache, ถ้าไม่มีให้ไปโหลดผ่านเน็ต
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});