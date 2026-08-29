import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// 小テスト形式の要は「10問打ち終えるまで正誤を出さない」こと。
// 1問でも途中で正誤が漏れると、そこで手が止まって元の1問1答へ戻る。
// 構造として固定しておき、あとから静かに漏れるのを防ぐ。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

const answerRow = readSrc("app/components/game/TypingAnswerRow.tsx");
const questionCard = readSrc("app/components/game/QuestionCard.tsx");
const studyScreen = readSrc("app/components/game/StudyScreen.tsx");
const page = readSrc("app/page.tsx");

test("正誤の表示は revealed でだけ開く", () => {
  // ◯/✕ を出すブロックが revealed に閉じ込められていること
  const marker = "{revealed && outcome && (";
  assert.ok(
    answerRow.includes(marker),
    "TypingAnswerRow の判定表示が revealed で守られていない",
  );

  // 判定の文言が、その revealed ブロックより前に出てきていないこと
  const gate = answerRow.indexOf(marker);
  const before = answerRow.slice(0, gate);
  for (const leak of ["◯ 正解", "✕ 不正解", "− 未回答"]) {
    assert.ok(
      !before.includes(leak),
      `TypingAnswerRow が revealed の外で「${leak}」を出している`,
    );
  }
});

test("設問行は正誤を受け取らない（回答済みの目印だけ持つ）", () => {
  // 正誤を props に持たせた時点で、うっかり出せる場所が増える
  for (const leak of ["correct", "outcome", "isCorrect"]) {
    assert.ok(
      !new RegExp(`\\b${leak}\\b`).test(questionCard),
      `QuestionCard が ${leak} を受け取っている（正誤を出せてしまう）`,
    );
  }
  assert.ok(
    /\banswered\b/.test(questionCard),
    "QuestionCard に回答済みの目印（answered）がない",
  );
});

test("出題中のヘッダーは正解数ではなく回答数を出す", () => {
  const header = studyScreen.slice(
    studyScreen.indexOf("<header"),
    studyScreen.indexOf("</header>"),
  );
  const scoreAt = header.indexOf("status.score");
  const answeredAt = header.indexOf("status.answered");
  assert.ok(answeredAt >= 0, "ヘッダーに回答数が出ていない");
  assert.ok(scoreAt >= 0, "ヘッダーに正解数が出ていない");
  assert.ok(
    header.includes('phase === "result"'),
    "ヘッダーの正解数が結果発表に限定されていない",
  );
  assert.ok(
    header.indexOf('phase === "result"') < scoreAt,
    "正解数が phase の分岐より前に出ている（出題中に見えてしまう）",
  );
});

test("答案は結果発表のときだけ revealed で描かれる", () => {
  assert.ok(
    page.includes('revealed: phase === "result"'),
    "答案の revealed が結果発表以外でも立ちうる",
  );
});

test("効果音は回答ごとに鳴らさない（音で正誤が漏れる）", () => {
  // 鳴らすのはセットの締め（プール解放が起きた回）だけ
  const calls = [...page.matchAll(/playCorrectSound\(\)/g)];
  assert.equal(calls.length, 1, "効果音の再生箇所が1つではない");
  const finishSet = page.slice(
    page.indexOf("const finishSet = useCallback"),
    page.indexOf("// 全問確定して採点も出そろったら"),
  );
  assert.ok(
    finishSet.includes("playCorrectSound()"),
    "効果音がセットの締め以外で鳴っている",
  );
});

test("採点は回答の確定ごとに投げっぱなしにする（結果を待たない）", () => {
  const hook = readSrc("app/hooks/useQuizSet.ts");
  assert.ok(
    /void gradeAnswer\(/.test(hook),
    "commit が採点の完了を待つ形になっている（待つとタイピングが止まる）",
  );
  assert.ok(
    !/await gradeAnswer\(/.test(hook),
    "commit が採点を await している",
  );
});
