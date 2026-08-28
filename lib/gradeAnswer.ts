import { normalizeAnswer } from "./answerNormalization";
import { GradeOutcome, VocabItem } from "./types";

/**
 * 1回答ぶんの採点。小テスト形式では、この関数の呼び出しを待たずに
 * 次の問題を打ち始められる（1回答＝1往復で、回答どうしに依存がない）。
 *
 * ネットワークに出るのは「完全一致でもなく、過去にAIが判定した覚えもない」
 * 回答だけ。10問のうち大半はここで即座に確定する。
 */

/** 正解として扱う status。API から来た文字列もここで判定する */
const CORRECT_STATUSES = new Set(["exact", "alternative", "ai_approved"]);

export function isCorrectStatus(status: string): boolean {
  return CORRECT_STATUSES.has(status);
}

export interface GradeAnswerParams {
  item: VocabItem;
  answerText: string;
  /** 過去にAIが正解と認めた回答。往復を省くためのローカルキャッシュ */
  approvedAnswers?: Record<string, string[]>;
  /** 過去にAIが不正解と判定した回答 */
  rejectedAnswers?: Record<string, string[]>;
  /** テストから採点APIを差し替えるための口。既定はグローバルの fetch */
  fetchImpl?: typeof fetch;
}

export async function gradeAnswer({
  item,
  answerText,
  approvedAnswers = {},
  rejectedAnswers = {},
  fetchImpl,
}: GradeAnswerParams): Promise<GradeOutcome> {
  const normalizedAnswers = (item.answers ?? []).map(normalizeAnswer);
  const user = normalizeAnswer(answerText);
  const base = { normalizedAnswers, posViolation: null, aiFeedback: null };

  // 完全一致はサーバ側 evaluateAnswer でも同じ normalizeAnswer による
  // 同じ判定になるため、API 往復を挟まず即座に確定させる。
  if (normalizedAnswers.includes(user)) {
    return { ...base, status: "exact", correct: true };
  }
  // 未回答（空白のみ含む）は表記ゆれ判定の余地がなく必ず不正解。
  if (!user) {
    return { ...base, status: "blank", correct: false };
  }
  // 過去にAIが認めた／退けた回答は、AIを呼び直さずその場で確定させる。
  if ((approvedAnswers[item.id] ?? []).includes(user)) {
    return { ...base, status: "ai_approved", correct: true };
  }
  if ((rejectedAnswers[item.id] ?? []).includes(user)) {
    return { ...base, status: "wrong", correct: false };
  }

  const doFetch = fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!doFetch) return { ...base, status: "wrong", correct: false };

  try {
    const response = await doFetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: answerText,
        target: item.target,
        collocation: item.collocation ?? "",
        answers: item.answers ?? [],
        partOfSpeech: item.partOfSpeech,
      }),
    });
    if (!response.ok) return { ...base, status: "wrong", correct: false };

    const result = await response.json();
    const status = typeof result?.status === "string" ? result.status : "wrong";
    return {
      status,
      correct: isCorrectStatus(status),
      normalizedAnswers: Array.isArray(result?.normalizedAnswers)
        ? result.normalizedAnswers
        : normalizedAnswers,
      posViolation: typeof result?.posViolation === "string" ? result.posViolation : null,
      aiFeedback: typeof result?.aiFeedback === "string" ? result.aiFeedback : null,
      aiScore: typeof result?.aiScore === "number" ? result.aiScore : undefined,
    };
  } catch {
    // 通信が落ちても完全一致までの判定で学習は続けられる
    return { ...base, status: "wrong", correct: false };
  }
}
