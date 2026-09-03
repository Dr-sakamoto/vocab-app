import { gradeLocally } from "./localGrade";
import { getExpectedAnswers } from "./question";
import type { ComposeDirection, ComposePrompt, CompositionGrade, TagJudgement } from "./types";
import { sanitizeTagJudgements } from "./aiCompositionReview";

/**
 * 1答案ぶんの採点をサーバーへ投げる。
 *
 * 呼び出し側（app/compose/hooks/useComposeSession.ts）はこの Promise を
 * 待たずに次の問題へ進む。採点の往復は次の答案を書いている時間と重なって
 * 消えるので、学習者から見ると待ち時間がない。単語アプリの小テストと
 * 同じ考え方だが、英作文はAIの生成が長いぶん効き目が大きい。
 *
 * 通信が落ちても学習は止めない。模範解答との照合（gradeLocally）まで
 * 落として、必ず何らかの採点結果を返す。
 */
export interface GradeCompositionParams {
  prompt: ComposePrompt;
  input: string;
  direction: ComposeDirection;
  /** テストから採点APIを差し替えるための口。既定はグローバルの fetch */
  fetchImpl?: typeof fetch;
}

function toGrade(
  raw: unknown,
  fallback: CompositionGrade,
  allowedTagIds: string[],
): CompositionGrade {
  if (!raw || typeof raw !== "object") return fallback;
  const result = raw as Record<string, unknown>;
  const score = typeof result.score === "number" ? result.score : null;
  if (score === null) return fallback;

  const verdict =
    result.verdict === "pass" || result.verdict === "close" || result.verdict === "review"
      ? result.verdict
      : fallback.verdict;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    verdict,
    corrected: typeof result.corrected === "string" ? result.corrected : fallback.corrected,
    feedback: typeof result.feedback === "string" ? result.feedback : "",
    good: typeof result.good === "string" ? result.good : "",
    // タグ判定は弱点データへ直に入る。サーバーを経由していても、
    // 受け取り側でもう一度タグ表に照らして絞る。
    tags: sanitizeTagJudgements(result.tags, allowedTagIds) as TagJudgement[],
    aiJudged: result.aiJudged === true,
  };
}

export async function gradeComposition({
  prompt,
  input,
  direction,
  fetchImpl,
}: GradeCompositionParams): Promise<CompositionGrade> {
  const answers = getExpectedAnswers(prompt, direction);
  const fallback = gradeLocally({ input, answers, direction });

  // 空欄はサーバーに聞くまでもない（採点するものが無い）。
  if (!input.trim()) return fallback;

  const doFetch = fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return fallback;

  try {
    const response = await doFetch("/api/compose/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId: prompt.id, input, direction }),
    });
    if (!response.ok) return fallback;
    return toGrade(await response.json(), fallback, [...prompt.tags]);
  } catch {
    return fallback;
  }
}
