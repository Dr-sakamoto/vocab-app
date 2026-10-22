import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// 進捗ページやフラッシュから戻って答案が描き直されたとき、答えるべき欄に
// カーソルが戻ること（タップし直さずに打ち始められること）を構造で固定する。

const root = new URL("../", import.meta.url);
const sheet = readFileSync(new URL("app/components/game/QuizSheet.tsx", root), "utf8");
const row = readFileSync(new URL("app/components/game/TypingAnswerRow.tsx", root), "utf8");

test("カーソルを置くのは、見えている設問のうち未確定の最初の1問だけ", () => {
  assert.match(sheet, /visibleSlots\.find\(\(slot\) => entries\[slot\] && !entries\[slot\]\.committed\)/);
  assert.match(sheet, /autoFocus=\{slot === activeSlot\}/);
});

test("カーソルは描かれたときに一度だけ置く（打っている最中に奪わない）", () => {
  assert.match(row, /useEffect\(\(\) => \{\s*if \(autoFocusOnMount\.current\) ownRef\.current\?\.focus\(\{ preventScroll: true \}\);\s*\}, \[\]\);/);
});
