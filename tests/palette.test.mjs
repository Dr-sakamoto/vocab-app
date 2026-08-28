import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { POOL_TIERS } from "../lib/poolTier.js";
import { RETENTION_LEVELS } from "../lib/retention.js";

// 配色の根拠を数値で固定するテスト。
// 「見た目の好み」ではなく検証可能な条件として残し、あとから色を触ったときに
// 読みづらさが静かに混入するのを防ぐ。
//
// 判定基準（WCAG 2.1）
//   - SC 1.4.3 Contrast (Minimum): 本文 4.5:1、大きな文字 3:1
//   - SC 1.4.6 Contrast (Enhanced): 本文 7:1
//   - SC 1.4.11 Non-text Contrast: UI部品の境界 3:1

function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  assert.ok(m, `16進6桁の色ではない: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** sRGB の相対輝度（WCAG 2.x の定義） */
function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** globals.css の :root から --トークン: #色; を読み出す */
function readTokens() {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const tokens = {};
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[name] = value;
  }
  return tokens;
}

const T = readTokens();

test("配色トークンが globals.css に揃っている", () => {
  for (const name of [
    "surface-0",
    "surface-1",
    "surface-2",
    "ink-1",
    "ink-2",
    "ink-3",
    "line",
    "line-strong",
    "accent",
    "positive",
    "negative",
    "negative-surface",
  ]) {
    assert.ok(T[name], `--${name} が定義されていない`);
  }
});

test("文字色は地の上で必要なコントラストを満たす", () => {
  const bg = T["surface-0"];
  // 出題語・正解語。読ませることが目的なので AAA（7:1）を要求する
  assert.ok(contrastRatio(T["ink-1"], bg) >= 7, `ink-1: ${contrastRatio(T["ink-1"], bg)}`);
  assert.ok(contrastRatio(T["ink-2"], bg) >= 7, `ink-2: ${contrastRatio(T["ink-2"], bg)}`);
  // 補助情報は AA（4.5:1）
  assert.ok(contrastRatio(T["ink-3"], bg) >= 4.5, `ink-3: ${contrastRatio(T["ink-3"], bg)}`);
  // カード面の上でも成立すること（面が変わって読めなくなるのを防ぐ）
  assert.ok(contrastRatio(T["ink-3"], T["surface-1"]) >= 4.5);
  assert.ok(contrastRatio(T["ink-3"], T["surface-2"]) >= 4.5);
});

test("主要文字のコントラストを上げすぎない（純黒×純白のハレーション回避）", () => {
  // 21:1（#000×#fff）に近づくほど、暗所のOLEDで白文字がにじむ。
  // AAA を十分超えたところで頭打ちにする。
  assert.ok(contrastRatio(T["ink-1"], T["surface-0"]) <= 17);
});

test("操作色・判定色は本文と同じ基準で読める", () => {
  const bg = T["surface-0"];
  for (const name of ["accent", "positive", "negative"]) {
    const ratio = contrastRatio(T[name], bg);
    assert.ok(ratio >= 4.5, `${name}: ${ratio}`);
  }
  // 塗りつぶしボタン（.btn-accent）の上の文字
  assert.ok(contrastRatio(T["accent-ink"], T["accent"]) >= 4.5);
});

test("不正解パネルでは、覚えるべき訳語がいちばん読みやすい色になっている", () => {
  const panel = T["negative-surface"];
  const answer = contrastRatio(T["ink-1"], panel); // 正解の訳語
  const label = contrastRatio(T["negative"], panel); // 「不正解」ラベル
  assert.ok(answer >= 7, `正解の訳語が AAA 未満: ${answer}`);
  assert.ok(label >= 4.5, `ラベルが AA 未満: ${label}`);
  assert.ok(
    answer > label,
    "赤いラベルより訳語のほうが読みやすくあること（学習対象を最も読みやすく）",
  );
});

test("操作可能なUI部品の輪郭は 3:1 以上（SC 1.4.11）", () => {
  assert.ok(contrastRatio(T["line-strong"], T["surface-0"]) >= 3);
  assert.ok(contrastRatio(T["line-strong"], T["surface-2"]) >= 3);
});

test("判定色どうしが輝度でも区別できる（色相だけに頼らない）", () => {
  // 赤緑の色覚特性では正解/不正解の色相差が縮む。輝度差を残しておけば
  // 色相が潰れても区別が残る。テキスト（◯/✕）と併用しているため
  // SC 1.4.1 は満たすが、色の側でも冗長性を持たせる。
  const positive = relativeLuminance(T["positive"]);
  const negative = relativeLuminance(T["negative"]);
  assert.ok(
    Math.abs(positive - negative) / Math.max(positive, negative) >= 0.2,
    `正解色と不正解色の輝度差が小さい: ${positive} vs ${negative}`,
  );
});

test("Tier の色は順位どおりに明るくなる連続スケール（虹色を使わない）", () => {
  // POOL_TIERS は minPool の降順（上位が先頭）。上位ほど輝度が高いこと。
  for (let i = 1; i < POOL_TIERS.length; i += 1) {
    const upper = relativeLuminance(POOL_TIERS[i - 1].color);
    const lower = relativeLuminance(POOL_TIERS[i].color);
    assert.ok(
      upper > lower,
      `${POOL_TIERS[i - 1].label} が ${POOL_TIERS[i].label} より暗い（順位が色から読めない）`,
    );
  }
});

test("Tier の色はすべて地の上で読める", () => {
  for (const tier of POOL_TIERS) {
    const ratio = contrastRatio(tier.color, T["surface-0"]);
    assert.ok(ratio >= 4.5, `${tier.label}: ${ratio}`);
  }
});

test("定着レベルの色は段階どおりに明るくなる連続スケール", () => {
  for (let i = 1; i < RETENTION_LEVELS.length; i += 1) {
    const lower = relativeLuminance(RETENTION_LEVELS[i - 1].color);
    const higher = relativeLuminance(RETENTION_LEVELS[i].color);
    assert.ok(
      higher > lower,
      `${RETENTION_LEVELS[i].label} が ${RETENTION_LEVELS[i - 1].label} より暗い（段階が色から読めない）`,
    );
  }
});

test("定着レベルの色はすべて地の上で読める", () => {
  for (const l of RETENTION_LEVELS) {
    const ratio = contrastRatio(l.color, T["surface-0"]);
    assert.ok(ratio >= 4.5, `${l.label}: ${ratio}`);
  }
});

test("コアループ画面に生の16進カラーが残っていない（トークン経由で色を決める）", () => {
  const files = [
    "../app/components/game/StudyScreen.tsx",
    "../app/components/game/QuestionCard.tsx",
    "../app/components/game/TypingAnswerRow.tsx",
    "../app/components/game/RetentionRing.tsx",
    "../app/components/flash/FlashScreen.tsx",
    "../app/components/InlineResult.tsx",
    "../app/components/ModeTabs.tsx",
  ];
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const hits = [...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
    assert.deepEqual(hits, [], `${file} に直書きの色が残っている`);
  }
});
