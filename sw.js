const CACHE_NAME = "cop-management-v18";

const FILES = [
"./",
"./index.html",
"./services.html",
"./qui-sommes-nous.html",
"./actualites.html",
"./contact.html",
"./carrieres.html",
"./espace-client.html",
"./styles.css",
"./app.js",
"./manifest.webmanifest",
"./logo-cop.svg",
"./file_000000005f08820eacac3df97f5f3cab.png"
];

self.addEventListener("install", event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(FILES))
.then(() => self.skipWaiting())
);
});

self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys
.filter(key => key !== CACHE_NAME)
.map(key => caches.delete(key))
)
).then(() => self.clients.claim())
);
});

self.addEventListener("fetch", event => {
if (event.request.method !== "GET") return;

const url = new URL(event.request.url);

if (url.origin !== self.location.origin) return;

event.respondWith(
fetch(event.request)
.then(response => {
if (response.ok) {
const copy = response.clone();
caches.open(CACHE_NAME).then(cache =>
cache.put(event.request, copy)
);
}
return response;
})
.catch(() => caches.match(event.request))
);
});
