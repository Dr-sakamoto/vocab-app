import { COMPOSE } from "./constants";
import { getTagLabel } from "./grammarTags";
import { getMastery } from "./mastery";
import type { ComposeAttempt, ComposeProgress } from "./types";

// =====================================================
// セッションの講評。
//
// 単語アプリの評価（lib/playEvaluation.ts）はXPと段位を出すものだった。
// こちらが出すのは点数ではなく「今日どこが動いたか」。1セッション5問の
// 英作文は、点数だけ見れば毎回そう変わらない。伸びを実感できるのは
// タグ単位の習熟度が動いたときなので、そこを主役にする。
//
// 文言の方針:
//   - 落とした問題を責めない。責められて続く学習ではない
//   - 事実で褒める（「よくできました」ではなく「関係詞が3回連続で合格」）
//   - 次にやることを1つだけ示す。3つ挙げると1つも残らない
// =====================================================

export interface TagDelta {
  tagId: string;
  label: string;
  /** セッション前後の習熟度（0〜100） */
  before: number;
  after: number;
  delta: number;
}

export interface SessionEvaluation {
  total: number;
  passCount: number;
  averageScore: number;
  grade: string;
  title: string;
  message: string;
  /** このセッションで触れたタグの変化。習熟度が上がった順 */
  tagDeltas: TagDelta[];
  /** 伸びたタグ */
  improved: TagDelta[];
  /** 次に狙うタグ（今回いちばん落としたもの）。無ければ null */
  focus: TagDelta | null;
}

function gradeFor(averageScore: number): { grade: string; title: string } {
  if (averageScore >= 90) return { grade: "S", title: "文句なし" };
  if (averageScore >= COMPOSE.PASS_SCORE) return { grade: "A", title: "伝わる英語" };
  if (averageScore >= COMPOSE.CLOSE_SCORE) return { grade: "B", title: "あと一歩" };
  return { grade: "C", title: "収穫のあるセット" };
}

export interface EvaluateSessionParams {
  attempts: ComposeAttempt[];
  /** セッション開始時点の学習状態 */
  before: ComposeProgress;
  /** セッションを畳み込んだあとの学習状態 */
  after: ComposeProgress;
  /** 連続学習日数。文言でだけ使う */
  streakDays?: number;
}

/**
 * セッションの成績とタグの変化をまとめる。
 *
 * 講評の文は「伸びたタグ → 連続日数 → 粘り」の順で理由を探し、
 * 最初に見つかったものを使う。事実が無いときだけ、一般的な励ましに落ちる。
 */
export function evaluateSession({
  attempts,
  before,
  after,
  streakDays = 0,
}: EvaluateSessionParams): SessionEvaluation {
  const total = attempts.length;
  const passCount = attempts.filter((a) => a.score >= COMPOSE.PASS_SCORE).length;
  const averageScore =
    total > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / total) : 0;

  const touchedTagIds = [...new Set(attempts.flatMap((attempt) => attempt.tags))];
  const tagDeltas: TagDelta[] = touchedTagIds
    .map((tagId) => {
      const beforeMastery = getMastery(before.tags[tagId]);
      const afterMastery = getMastery(after.tags[tagId]);
      return {
        tagId,
        label: getTagLabel(tagId),
        before: beforeMastery,
        after: afterMastery,
        delta: afterMastery - beforeMastery,
      };
    })
    .sort((a, b) => b.delta - a.delta);

  const improved = tagDeltas.filter((tag) => tag.delta > 0);
  const dropped = tagDeltas.filter((tag) => tag.delta < 0);
  const focus = dropped.length > 0 ? dropped[dropped.length - 1] : null;

  const { grade, title } = gradeFor(averageScore);

  return {
    total,
    passCount,
    averageScore,
    grade,
    title,
    message: buildMessage({ improved, focus, streakDays, passCount, total, attempts }),
    tagDeltas,
    improved,
    focus,
  };
}

function buildMessage({
  improved,
  focus,
  streakDays,
  passCount,
  total,
  attempts,
}: {
  improved: TagDelta[];
  focus: TagDelta | null;
  streakDays: number;
  passCount: number;
  total: number;
  attempts: ComposeAttempt[];
}): string {
  const best = improved[0];
  if (best && best.delta >= 5) {
    return `「${best.label}」の習熟度が ${best.before} → ${best.after} に上がりました。`;
  }
  if (passCount === total && total > 0) {
    return "全問が合格ラインを超えました。次はレベルを一段上げても大丈夫です。";
  }
  if (streakDays >= 3) {
    return `${streakDays}日続いています。英作文は続けた日数がそのまま書ける文の数になります。`;
  }
  if (focus) {
    return `今日の収穫は「${focus.label}」が弱点だと分かったこと。次のセットで戻ってきます。`;
  }
  const longest = attempts.reduce((max, a) => Math.max(max, a.input.trim().length), 0);
  if (longest >= 40) {
    return "長い文を最後まで書き切りました。書ける長さは、そのまま話せる長さになります。";
  }
  return "書いた答案はすべて記録しました。分析画面でどこが弱いか見えます。";
}
