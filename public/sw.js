// Testall — Service Worker
// 方針:
//   ナビゲーション(HTML) = network-first … 常に最新UIを取りに行く(更新が即届く)
//   静的アセット(JS/CSS/画像/font) = stale-while-revalidate … 即表示しつつ裏で更新→次回は最新
//   API = network-first
// ⚠️ デプロイで内容が変わったら CACHE_VERSION を必ず上げること。
//    上げると activate 時に古いキャッシュが全削除され、全ユーザーに最新が行き渡る。
// ※ 手動で直すには DevTools → Application → Service Workers → Unregister + Clear storage。

const CACHE_VERSION = "testall-v4";
// HTML は network-first なので precache は最小限(オフライン時の保険)のみ。
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  // 新しいSWを待たせず即有効化
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API は network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // ナビゲーション(HTML) は network-first（常に最新を取りに行く・失敗時のみキャッシュ）
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || caches.match("/")),
      ),
    );
    return;
  }

  // 静的アセットは stale-while-revalidate（cache即返し＋裏で更新→次回最新）
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((hit) => {
          const fetching = fetch(request)
            .then((res) => {
              if (res && res.status === 200) cache.put(request, res.clone());
              return res;
            })
            .catch(() => hit);
          // キャッシュがあれば即返し、無ければネットワーク待ち
          return hit || fetching;
        }),
      ),
    );
  }
});
