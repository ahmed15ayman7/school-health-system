const CACHE = "school-health-v1";
const OFFLINE_QUEUE = "offline-clinical-queue";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])));
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("/"))),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "QUEUE_CLINICAL") {
    event.waitUntil(
      caches.open(OFFLINE_QUEUE).then(async (cache) => {
        const key = `q-${Date.now()}`;
        await cache.put(key, new Response(JSON.stringify(event.data.payload)));
      }),
    );
  }
  if (event.data?.type === "CLEAR_SENSITIVE") {
    event.waitUntil(caches.delete(OFFLINE_QUEUE));
  }
});
