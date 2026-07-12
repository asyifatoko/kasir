// Service worker Kasir Asyifa POS
// Strategi sengaja dibuat sederhana & aman (tidak pakai build-time
// precache manifest dari bundler), supaya tidak perlu tooling tambahan:
//
//  - Halaman/navigasi (mode "navigate"): NETWORK-FIRST. Kalau online,
//    selalu ambil versi terbaru dari server. Kalau offline, jatuhkan ke
//    app-shell ("/") yang tersimpan di cache supaya aplikasi tetap bisa
//    dibuka (data barang/transaksi sendiri sudah punya cadangan sendiri
//    di localStorage lewat POSStorage, terpisah dari cache ini).
//  - Aset statis same-origin (JS/CSS/font/gambar hasil build Vite, nama
//    filenya sudah mengandung hash): CACHE-FIRST. Aman di-cache lama
//    karena kontennya immutable per-hash; kalau ada versi baru, nama
//    filenya otomatis beda dan tidak akan "nyangkut" ke cache lama.
//  - Semua request ke domain LAIN (mis. Supabase, Google Fonts, API
//    Gemini di /api/*) TIDAK disentuh sama sekali oleh service worker
//    ini -> selalu langsung ke jaringan, supaya data toko (stok,
//    transaksi, dst) tidak pernah ketinggalan/basi karena ke-cache.

const CACHE_VERSION = "kasir-asyifa-v1";
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // Precache satu-satu dengan try/catch supaya 1 URL gagal (mis. lagi
      // offline saat install pertama kali) tidak menggagalkan seluruh
      // instalasi service worker.
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn("[SW] Gagal precache", url, err);
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Cuma tangani GET same-origin. Request lain (POST ke Supabase, request
  // cross-origin, dsb) dibiarkan lewat apa adanya ke jaringan.
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Jangan cache endpoint API lokal (mis. /api/generate-item ke Gemini) —
  // itu harus selalu request baru, bukan hasil lama yang di-cache.
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirstNavigate(req));
    return;
  }

  event.respondWith(cacheFirstStatic(req));
});

async function networkFirstNavigate(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_VERSION);
    cache.put("/", fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match("/");
    if (cached) return cached;
    return new Response(
      "<h1>Sedang offline</h1><p>Halaman ini belum pernah dibuka sebelumnya saat online, jadi belum bisa ditampilkan offline.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

async function cacheFirstStatic(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const fresh = await fetch(req);
    // Cuma cache response yang sukses, biar respon error tidak "nyangkut"
    if (fresh && fresh.ok) {
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    // Offline & belum ada di cache -> tidak ada yang bisa dikembalikan
    throw err;
  }
}
