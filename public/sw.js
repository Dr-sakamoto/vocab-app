/**
 * アプリシェルのキャッシュ。
 *
 * キャッシュ先勝ちで返してよいのは「中身が変わればURLも変わる」ものだけ。
 * Next.js の App Router は画面遷移のたびに `/result?_rsc=...` のような
 * ルーティング用ペイロードを取りに行くが、これは同じURLのままデプロイごとに
 * 中身が変わる。これを永続キャッシュから返すと、ルーターは古いビルドの
 * ペイロードを受け取り、復帰のためにフルリロードへ切り替える。
 *
 * それが結果発表（`/result`）への遷移で起きると、クイズの状態を持つ
 * Provider ごと作り直され、結果は状態にしか無いので `/` へ戻される。
 * 画面には結果が一瞬（数百ms）だけ見えて、次のセットの1問目が出る——
 * 一度キャッシュに載ると再取得されないため、これが毎セット繰り返される。
 *
 * そのため、ここでキャッシュするのは内容ハッシュ付きの静的アセットと、
 * オフライン時に見せる土台だけに絞る。API・RSCペイロード・その他のGETは
 * Service Worker が触らず、そのままネットワークへ抜けさせる。
 */
const CACHE_NAME = "vocab-app-shell-v2";
/** オフラインのときに返す土台。HTMLをキャッシュするのはここだけ */
const OFFLINE_SHELL = "/";
const SHELL_ASSETS = [OFFLINE_SHELL, "/manifest.webmanifest", "/icon.svg"];

/**
 * キャッシュ先勝ちにしてよいURLか。
 * 内容が変わったときにURLも変わる（＝古い中身を掴み続けようがない）ものだけ true。
 */
function isCacheableAsset(url) {
  const path = url.pathname;
  // ビルドごとに内容ハッシュが付く。JS・CSS・フォントはすべてこの下
  if (path.startsWith("/_next/static/")) return true;
  // 差し替えの無い固定アセット
  if (path.startsWith("/icons/")) return true;
  return path === "/icon.svg" || path === "/manifest.webmanifest" || path === "/success.mp3";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // 名前を変えた時点で、古い版が溜め込んだペイロードごと捨てる
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 画面そのものは必ずネットワークから。落ちているときだけ土台を返す
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // オフライン用の土台は、最新のビルドのものへ差し替えておく
          if (response.ok && url.pathname === OFFLINE_SHELL) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_SHELL, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_SHELL).then((res) => res || Response.error()))
    );
    return;
  }

  // API・RSCペイロードなど、URLが内容と一対一でないものには触らない
  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
