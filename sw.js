const CACHE = "didge-stock-v1";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/firebase-config.js",
  "./js/roles.js",
  "./js/pwa.js",
  "./pages/dashboard.html",
  "./pages/products.html",
  "./pages/import.html",
  "./pages/stock.html",
  "./pages/sales.html",
  "./pages/suppliers.html",
  "./pages/cash.html",
  "./pages/expenses.html",
  "./pages/staff.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});