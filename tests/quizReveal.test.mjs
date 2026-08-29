import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// 判定の公開は「随時公開」。その設問の採点が返った時点で、その行に出す。
//
// 守りたいのは2つ。
//   1. まだ採点が返っていない設問の正誤は出さない。採点の完了を待つ形に
//      なった時点で、そこで手が止まって1問1答へ戻る。
//   2. 判定は回答行の1か所だけが持つ。設問行・ヘッダー・音へ広げると、
//      打っている行を探す手間と、リズムへの割り込みが増える。
// 構造として固定しておき、あとから静かに崩れるのを防ぐ。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

const answerRow = readSrc("app/components/game/TypingAnswerRow.tsx");
const questionCard = readSrc("app/components/game/QuestionCard.tsx");
const studyScreen = readSrc("app/components/game/StudyScreen.tsx");
const quizSheet = readSrc("app/components/game/QuizSheet.tsx");
const hook = readSrc("app/hooks/useQuizSet.ts");
const page = readSrc("app/page.tsx");

test("判定は採点結果が返った設問でだけ開く", () => {
  // ◯/✕ を出すブロックが outcome の有無で閉じ込められていること
  const marker = "{outcome && (";
  assert.ok(
    answerRow.includes(marker),
    "TypingAnswerRow の判定表示が outcome で守られていない",
  );

  // 判定の文言が、そのブロックより前に出てきていないこと
  const gate = answerRow.indexOf(marker);
  const before = answerRow.slice(0, gate);
  for (const leak of ["◯ 正解", "✕ 不正解", "− 未回答"]) {
    assert.ok(
      !before.includes(leak),
      `TypingAnswerRow が outcome の外で「${leak}」を出している`,
    );
  }
});

test("outcome が入るのは採点が返ったときだけ（未確定・打ち直し中は消える）", () => {
  // 確定した瞬間は outcome を null に落とす（採点前に前回の判定を残さない）
  const commit = hook.slice(
    hook.indexOf("const commit = useCallback"),
    hook.indexOf("/** commit 直後にも使えるよう"),
  );
  assert.ok(
    /committed: true, outcome: null/.test(commit),
    "確定時に outcome が null へ落ちていない（古い判定が残る）",
  );

  // 打ち直したら、その設問の判定は消える
  const setInput = hook.slice(
    hook.indexOf("const setInput = useCallback"),
    hook.indexOf("const commit = useCallback"),
  );
  assert.ok(
    /committed: false, outcome: null/.test(setInput),
    "打ち直しで outcome が null へ戻っていない（古い判定が残る）",
  );
});

test("設問行は正誤を受け取らない（判定は回答行の1か所だけが持つ）", () => {
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
  // 判定は各行で読める。ヘッダーに正解数を足すと、1問ごとに増減を目で
  // 追いにいく分だけ打つ手が止まる（カウンタは割り込みになる）。
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

test("答案を読むだけの面にするのは結果発表のときだけ", () => {
  assert.ok(
    page.includes('revealed: phase === "result"'),
    "答案の revealed が結果発表以外でも立ちうる",
  );
});

test("効果音は回答ごとに鳴らさない（打つリズムへの割り込みになる）", () => {
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
  assert.ok(
    /void gradeAnswer\(/.test(hook),
    "commit が採点の完了を待つ形になっている（待つとタイピングが止まる）",
  );
  assert.ok(
    !/await gradeAnswer\(/.test(hook),
    "commit が採点を await している",
  );
});

test("判定が生えても、打っている行は画面のその場に留まる", () => {
  // 判定を随時出す以上、上の行は採点の戻り（ユーザーの操作と無関係な
  // タイミング）で伸び縮みする。そのぶんスクロールを送り返さないと、
  // 打っている最中に行が下へ流れる。
  assert.ok(
    /scrollTop \+= drift/.test(quizSheet),
    "QuizSheet が上の行の伸縮ぶんをスクロールで打ち消していない",
  );
  assert.ok(
    /window\.addEventListener\("scroll", sync, true\)/.test(quizSheet),
    "自分でスクロールしたときに基準位置を取り直していない（元へ引き戻される）",
  );
});

test("設問を送るときのスクロールは1回だけにする", () => {
  // ブラウザ既定のフォーカス時スクロールと答案側の追従が二重に走ると、
  // 行き過ぎてから戻る「跳ね」になる。寄せるのは答案側の1回だけ。
  assert.ok(
    /focus\(\{ preventScroll: true \}\)/.test(page),
    "フォーカス時のブラウザ既定スクロールを止めていない",
  );
  assert.ok(
    /block: "nearest"/.test(quizSheet),
    "答案の追従が最小移動（block: nearest）になっていない",
  );
});
