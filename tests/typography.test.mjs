import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 書体の方針を数値・構造として固定するテスト。
//
// 方針
//   1. 出題語だけがセリフ体（--font-word）。それ以外は日本語・英数字とも
//      1つの細ゴシック（--font-ui）で通す。
//   2. 和文と欧文を別ファミリーに分ける書体をスタックの先頭に置かない。
//      system-ui を先頭にすると、同じ一行の中でラテン文字だけOSのUI書体に
//      なり「0 / 10 正解」のような混在行で字面と太さが揃わない。
//   3. ウェイトは1つだけ。強弱は太さではなく文字色とサイズで付ける。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

const css = readSrc("app/globals.css");
const layout = readSrc("app/layout.tsx");

/** app/ 配下の .tsx を全部集める */
function collectTsx(dir = "app") {
  const out = [];
  for (const entry of readdirSync(new URL(dir + "/", root), { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...collectTsx(join(dir, entry.name)));
    else if (entry.name.endsWith(".tsx")) out.push(join(dir, entry.name));
  }
  return out;
}

const tsxFiles = collectTsx();

test("body のフォントスタックは和欧文が同一ファミリーの書体だけで構成する", () => {
  const body = css.slice(css.indexOf("\nbody {"));
  const stack = body.slice(body.indexOf("font-family:"), body.indexOf(";", body.indexOf("font-family:")));

  assert.ok(
    stack.includes("var(--font-ui)"),
    "先頭に和欧文を1ファミリーで持つ書体（--font-ui）が来ていない",
  );
  // 欧文専用書体が混ざると、日本語だけ別書体へフォールバックして二重書体になる
  for (const latinOnly of ["system-ui", "Arial", "Helvetica", "-apple-system", "Segoe UI", "Roboto"]) {
    assert.ok(
      !stack.includes(latinOnly),
      `欧文専用の ${latinOnly} がスタックに入っている（和文と別書体になる）`,
    );
  }
});

test("UIの基準ウェイトが body に明示されている", () => {
  const body = css.slice(css.indexOf("\nbody {"));
  const decl = body.slice(0, body.indexOf("}"));
  assert.match(decl, /font-weight:\s*300/, "body に font-weight: 300 がない");
});

test("読み込むUI書体のウェイトは1つだけ（太字を使わない）", () => {
  const m = /Noto_Sans_JP\(\{[^}]*weight:\s*\[([^\]]*)\]/s.exec(layout);
  assert.ok(m, "layout.tsx で Noto_Sans_JP の weight 指定が見つからない");
  const weights = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  assert.equal(weights.length, 1, `ウェイトが複数ある: ${weights.join(", ")}`);
});

test("コンポーネントに太さ指定のユーティリティが残っていない", () => {
  // 読み込んでいないウェイトを指定すると合成ボールドで字形が崩れる。
  // 階層は文字色（--ink-1/2/3）とサイズで付ける方針。
  for (const file of tsxFiles) {
    const hits = [...readSrc(file).matchAll(/\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g)]
      .map((x) => x[0]);
    assert.deepEqual(hits, [], `${file} に太さ指定が残っている`);
  }
});

test("セリフ体（--font-word）は出題語だけに使う", () => {
  // CSS変数名（--font-word）ではなく Tailwind のユーティリティ指定だけを拾う
  const users = tsxFiles.filter((f) => /(?<!-)\bfont-word\b/.test(readSrc(f)));
  assert.deepEqual(
    users.sort(),
    ["app/components/flash/FlashScreen.tsx", "app/components/game/QuestionCard.tsx"].sort(),
    "出題カード以外でセリフ体が使われている",
  );
});

test("外部フォントCDNを直接読み込まない（next/font 経由で自己ホストする）", () => {
  for (const file of tsxFiles) {
    const src = readSrc(file);
    assert.ok(
      !src.includes("fonts.googleapis.com") && !src.includes("fonts.gstatic.com"),
      `${file} が外部フォントCDNを直接参照している`,
    );
  }
});
