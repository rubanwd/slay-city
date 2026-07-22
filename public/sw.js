const CACHE_NAME = "slay-city-v3";
// Images (map backgrounds, location icons, wardrobe art) live in their own
// cache that survives app-shell version bumps, so a released update never
// re-downloads the heavy artwork.
const IMAGE_CACHE = "slay-city-images-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/wardrobe/slay-base.webp"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cache-first for images: serve instantly from cache, otherwise fetch, store a
// copy (including cross-origin Supabase Storage art) and return it. Once an
// image has been seen, later loads are offline-capable and instant.
function handleImage(request) {
  return caches.open(IMAGE_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache opaque (status 0) cross-origin responses too — they still
        // render in <img>, and this is what makes remote art persist.
        if (response && (response.ok || response.type === "opaque")) {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.destination === "image") {
    event.respondWith(handleImage(request).catch(() => caches.match(request)));
    return;
  }

  // Same-origin non-image: network-first with cache fallback (offline shell).
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
