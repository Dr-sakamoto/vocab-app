import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 画面の置き場所の約束を、文章ではなくテストとして固定する。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

test("useQuizGame を使うページは (quiz) ルートグループの下に置く", () => {
  // Provider は app/(quiz)/layout.tsx にしかない。外にページを足すと、
  // ビルドの事前描画が "must be used within QuizGameProvider" で落ちる
  // （実際に /progress の追加とぶつかった）。
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(new URL(dir + "/", root), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name));
      else if (entry.name === "page.tsx") pages.push(join(dir, entry.name));
    }
  };
  walk("app");

  for (const page of pages) {
    if (!readSrc(page).includes("useQuizGame")) continue;
    assert.ok(
      page.startsWith("app/(quiz)/"),
      `${page} が (quiz) グループの外で useQuizGame を使っている`,
    );
  }
});

test("クイズの Provider はルートレイアウトではなくルートグループに置く", () => {
  // ルートに置くと、規約・プライバシーなどクイズの状態を要らない画面まで
  // 出題プールの読み込みとクラウド同期が走る。
  assert.ok(!readSrc("app/layout.tsx").includes("QuizGameProvider"));
  assert.ok(readSrc("app/(quiz)/layout.tsx").includes("QuizGameProvider"));
});
