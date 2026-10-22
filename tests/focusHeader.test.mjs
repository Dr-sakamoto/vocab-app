import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// 出題中（1問目を確定してから結果発表まで）は、押せるものをヘッダーから隠す。
// 視界に押せるものがあると脱線のきっかけになる。構造として固定しておく。

const studyScreen = readFileSync(
  new URL("../app/components/game/StudyScreen.tsx", import.meta.url),
  "utf8",
);

test("集中中かどうかは出題中かつ回答が1問以上あること", () => {
  assert.match(studyScreen, /const focused = phase === "quiz" && status\.answered > 0;/);
});

test("集中中はモード切替と右側の操作群を隠す（レイアウトは動かさない）", () => {
  assert.match(studyScreen, /focused \? "pointer-events-none invisible opacity-0"/);
  const header = studyScreen.slice(
    studyScreen.indexOf("<header"),
    studyScreen.indexOf("</header>"),
  );
  const tabsAt = header.indexOf("<ModeTabs");
  const settingsAt = header.indexOf("設定を開く");
  assert.ok(header.lastIndexOf("chromeClass", tabsAt) !== -1, "ModeTabs が隠れない");
  assert.ok(header.lastIndexOf("chromeClass", settingsAt) > tabsAt, "設定ボタンが隠れない");
});
