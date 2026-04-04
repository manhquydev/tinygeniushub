const OFFLINE_URL = "/offline";
const CACHE_NAME = "offline-cache-v3-cloud-garden";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/images/system/cloud-garden/system_offline_error.png",
  "/images/system/cloud-garden/system_404_error.png",
  "/images/system/cloud-garden/system_500_error.png",
  "/images/system/cloud-garden/system_loading_hero.png",
  "/images/system/cloud-garden/system_cloud_garden_status.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("offline-cache-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(async () => {
        if (event.request.destination === "document") {
          const cache = await caches.open(CACHE_NAME);
          return cache.match(OFFLINE_URL);
        }

        return new Response("", {
          status: 503,
          statusText: "Offline",
        });
      });
    })
  );
});
