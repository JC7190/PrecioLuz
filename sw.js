// Copia local de la app para que abra sin conexión.
// Se abre siempre con la copia guardada (rápido y sin cobertura);
// la versión nueva se baja por detrás y se ve en la siguiente apertura.
const CACHE = "luz-v4";
const APP = ["./", "index.html", "manifest.json", "apple-touch-icon.png", "icon-192.png", "icon-512.png",
  "fonts/bricolage-grotesque-latin-opsz-normal.woff2", "fonts/figtree-latin-400-normal.woff2", "fonts/figtree-latin-600-normal.woff2", "fonts/jetbrains-mono-latin-400-normal.woff2", "fonts/jetbrains-mono-latin-600-normal.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
// Solo se borran copias viejas de ESTA app: las demás apps de jc7190.github.io comparten el mismo espacio
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("luz-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Precios de Red Eléctrica: solo con internet, nunca se guardan
  if (/ree\.es/.test(url.hostname)) return;
  // Páginas de la app: se abre AL INSTANTE con la copia guardada.
  // Por detrás se descarga la versión nueva, que se verá la próxima vez que se abra.
  if (req.mode === "navigate") {
    const net = fetch(req, { cache: "no-store" }).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); }
      return r;
    });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.open(CACHE).then(c => c.match("index.html")).then(hit => hit || net));
    return;
  }
  // Resto (iconos, tipos de letra): copia guardada primero, y se guarda lo nuevo
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
