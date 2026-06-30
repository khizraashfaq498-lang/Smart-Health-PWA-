const CACHE_NAME = "smart-health-v1";

const ASSETS = [
  "index.html",
  "dashboard.html",
  "medications.html",
  "reports.html",
  "login.html",
  "pedometer.html",
  "vitals.html",
  "voice.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "styles.css",
  "app.js",
  "script.js",
  "login.js",
  "dashboard.js",
  "steps.js",
  "vitals.js",
  "medications.js",
  "bottom-nav.js",
  "voice.js",
  "voice.css",
  "medications.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-latest-steps') {
    event.waitUntil(fetchAndStoreSteps());
  }
});

async function fetchAndStoreSteps() {
  console.log("Syncing steps in the background...");
}
