import { COMPOSE } from "./constants";
import type { ComposeDirection, ComposeVerdict, CompositionGrade } from "./types";
import { normalizeJapanese, tokenizeEnglish } from "./normalize";

// =====================================================
// AIを使わない採点（フォールバック）。
//
// このアプリの採点はAIが本体で、模範解答との照合はAIが使えないときの
// 保険でしかない。保険として要るのは「正解／不正解」の二値ではなく、
// 模範解答にどれだけ近いかの目盛り。自由英作文では語順も語彙も揺れる
// ので、一致していない＝間違い、と断じてはいけない。
//
// ここで出したスコアも弱点データには入れる。AI判定が無いぶんタグごとの
// 内訳は出せないが、「その文法を含む問題で点が取れなかった」という
// 事実そのものは弱点の信号として使える。
// =====================================================

/** 語の多重集合としての一致度（F1）。語順は見ない */
function bagF1(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const token of b) counts.set(token, (counts.get(token) ?? 0) + 1);

  let overlap = 0;
  for (const token of a) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) {
      overlap += 1;
      counts.set(token, remaining - 1);
    }
  }
  const precision = overlap / a.length;
  const recall = overlap / b.length;
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/** 最長共通部分列の長さ。語順の一致を見るために使う */
function lcsLength(a: string[], b: string[]): number {
  const prev = new Array<number>(b.length + 1).fill(0);
  const cur = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j];
  }
  return prev[b.length];
}

/**
 * 英文どうしの近さ（0〜1）。
 *
 * 語の一致（F1）だけだと "Tokyo is bigger than Osaka" と
 * "Osaka is bigger than Tokyo" が満点で並ぶ。語順の一致（LCS）を
 * 3割混ぜて、語彙は合っているが並びが違う文を区別する。
 */
export function englishSimilarity(input: string, answer: string): number {
  const a = tokenizeEnglish(input);
  const b = tokenizeEnglish(answer);
  if (a.length === 0 || b.length === 0) return 0;
  const f1 = bagF1(a, b);
  const order = lcsLength(a, b) / Math.max(a.length, b.length);
  return 0.7 * f1 + 0.3 * order;
}

/** 文字bigramの一致度。語の切れ目が無い和文の照合に使う */
export function japaneseSimilarity(input: string, answer: string): number {
  const a = normalizeJapanese(input);
  const b = normalizeJapanese(answer);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) return a === b ? 1 : 0;

  const bigrams = (s: string) => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i += 1) out.push(s.slice(i, i + 2));
    return out;
  };
  return bagF1(bigrams(a), bigrams(b));
}

export function similarityFor(
  input: string,
  answer: string,
  direction: ComposeDirection,
): number {
  return direction === "ja-to-en"
    ? englishSimilarity(input, answer)
    : japaneseSimilarity(input, answer);
}

export function toVerdict(score: number): ComposeVerdict {
  if (score >= COMPOSE.PASS_SCORE) return "pass";
  if (score >= COMPOSE.CLOSE_SCORE) return "close";
  return "review";
}

export interface LocalGradeParams {
  input: string;
  /** 模範解答。向きによって英文（ja-to-en）か和文（en-to-ja）か変わる */
  answers: string[];
  direction: ComposeDirection;
}

/**
 * 模範解答にいちばん近いものを選び、その近さをスコアにする。
 *
 * 目盛りは素の類似度をそのまま使わず、90%以上の一致を満点に寄せる。
 * 冠詞ひとつの違いで 0.93 まで落ちるのが普通なので、素の値を点数に
 * すると「合っているのに合格しない」状態が常態化する。
 */
export function gradeLocally({ input, answers, direction }: LocalGradeParams): CompositionGrade {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      score: 0,
      verdict: "review",
      corrected: answers[0] ?? "",
      feedback: "回答が空でした。模範解答を音読してから、もう一度書いてみてください。",
      good: "",
      tags: [],
      aiJudged: false,
    };
  }

  let best = 0;
  let bestAnswer = answers[0] ?? "";
  for (const answer of answers) {
    const similarity = similarityFor(trimmed, answer, direction);
    if (similarity > best) {
      best = similarity;
      bestAnswer = answer;
    }
  }

  const score = Math.round(Math.min(1, best / 0.9) * 100);
  const verdict = toVerdict(score);

  return {
    score,
    verdict,
    corrected: bestAnswer,
    feedback:
      verdict === "pass"
        ? "模範解答とほぼ同じ形です（AI採点なし）。"
        : "模範解答との照合による採点です（AI採点なし）。",
    good: verdict === "review" ? "書き切ったこと自体が前進です。" : "模範解答に近い形で書けています。",
    tags: [],
    aiJudged: false,
  };
}
