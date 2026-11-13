// Sterke Beer: werkt ook offline na de eerste keer openen
const C = "sterkebeer-3d-v2";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/apk/")) return; // grote APK niet bewaren
  const req = e.request.mode === "navigate" ? e.request : new Request(e.request, { cache: "no-cache" }); // altijd even checken of er iets nieuws is
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
