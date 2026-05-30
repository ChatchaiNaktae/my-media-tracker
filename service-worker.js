importScripts('./version.js');

const CACHE_NAME = `media-tracker-${BUILD_VERSION}`;

const urlsToCache = [
    './',
    './index.html',
    './output.css',
    './src/js/main.js',
    './src/js/script.js',
    './src/js/theme.js',
    './src/js/ui.js',
    './src/js/auth.js',
    './src/js/dashboard.js',
    './src/js/history.js',
    './src/js/category.js',
    './src/js/data.js',
    './src/js/multiselect.js',
    './src/js/form.js',
    './src/js/list.js',
    './src/js/dropdown.js',
    './src/js/config.js',
    './manifest.json',
    './Assets/Images/favicon.ico',
    './Assets/Images/icon-192.png',
    './Assets/Images/icon-512.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // ล้างของเก่าทิ้ง
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});