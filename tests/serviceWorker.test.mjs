import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// Service Worker がキャッシュしてよいのは「中身が変わればURLも変わる」ものだけ。
//
// App Router は画面遷移のたびに `/result?_rsc=...` を取りに行く。これは同じURLの
// まま中身がデプロイごとに変わるので、キャッシュ先勝ちで返すと古いビルドの
// ペイロードが混ざり、ルーターはフルリロードで復帰しようとする。結果発表への
// 遷移でそれが起きると Provider ごと作り直され、結果は状態にしか無いため `/` へ
// 戻される（結果が一瞬だけ見えて次のセットへ飛ぶ）。一度載ると再取得されないので、
// 毎セット繰り返す。

const src = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

/** sw.js は classic worker なので import できない。判定関数だけ切り出して呼ぶ */
function loadIsCacheableAsset() {
  const fn = /function isCacheableAsset\(url\) \{[\s\S]*?\n\}/.exec(src);
  assert.ok(fn, "sw.js に isCacheableAsset が無い（キャッシュ対象の判定が消えている）");
  return new Function(`${fn[0]}\nreturn isCacheableAsset;`)();
}

test("ルーティング用ペイロード（RSC）はキャッシュしない", () => {
  const isCacheableAsset = loadIsCacheableAsset();
  assert.equal(isCacheableAsset(new URL("https://x.test/result?_rsc=1rf5f")), false);
  assert.equal(isCacheableAsset(new URL("https://x.test/?_rsc=1rf5f")), false);
});

test("HTMLとAPIもキャッシュしない", () => {
  const isCacheableAsset = loadIsCacheableAsset();
  assert.equal(isCacheableAsset(new URL("https://x.test/")), false);
  assert.equal(isCacheableAsset(new URL("https://x.test/result")), false);
  assert.equal(isCacheableAsset(new URL("https://x.test/api/check")), false);
});

test("内容ハッシュ付きの静的アセットはキャッシュしてよい", () => {
  const isCacheableAsset = loadIsCacheableAsset();
  for (const path of [
    "/_next/static/chunks/134c4osabliy3.js",
    "/_next/static/media/f46af381d7ab0951-s.028jy7dgzft8..woff2",
    "/icon.svg",
    "/success.mp3",
  ]) {
    assert.equal(isCacheableAsset(new URL(`https://x.test${path}`)), true, path);
  }
});

test("画面の取得はネットワーク優先で、キャッシュは落ちたときの土台だけ", () => {
  const navigate = src.slice(src.indexOf('request.mode === "navigate"'));
  const body = navigate.slice(0, navigate.indexOf("// API"));
  assert.ok(
    body.indexOf("fetch(request)") < body.indexOf("caches.match"),
    "ナビゲーションがキャッシュ先勝ちになっている",
  );
});

test("キャッシュ名を変えた版は、古い版が溜め込んだものを捨てる", () => {
  // 名前が同じままだと、すでに載ってしまった古いペイロードが残り続ける
  assert.ok(/key !== CACHE_NAME/.test(src), "activate で古いキャッシュを消していない");
  assert.ok(!/vocab-app-shell-v1"/.test(src), "キャッシュ名が v1 のまま（古い中身が残る）");
});
