import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// 結果発表から「落とした語だけをフラッシュで流す」導線の約束を固定する。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");
const flash = readSrc("app/components/flash/FlashScreen.tsx");
const context = readSrc("app/contexts/QuizGameContext.tsx");

test("落とした語の復習は、苦手フラッシュの続きの位置を上書きしない", () => {
  assert.match(flash, /if \(candidates\.length === 0 \|\| isFocused\) return;\s*storage\.set\(STORAGE_KEYS\.FLASH_PROGRESS/);
});

test("復習の対象はこのセットで不正解だった語だけ", () => {
  assert.match(
    context,
    /\.filter\(\(entry\) => entry\.outcome !== null && !entry\.outcome\.correct\)/,
  );
});

test("タブでモードを選び直すと復習の対象を外す", () => {
  const handler = context.slice(context.indexOf("const handleModeChange"));
  assert.match(handler.slice(0, 200), /setReviewIndices\(null\);/);
});
