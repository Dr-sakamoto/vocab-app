import storage from "../storage";
import { COMPOSE, COMPOSE_STORAGE_KEYS } from "./constants";
import { isGrammarTagId } from "./grammarTags";
import { applyScoreToTagStat } from "./mastery";
import type {
  ComposeAttempt,
  ComposeProgress,
  ComposeSettings,
  PromptStat,
  TagStat,
} from "./types";

// =====================================================
// 学習状態の保存と畳み込み。
//
// 保存先は当面 localStorage だけ。単語アプリと同じくクラウド同期
// （Supabase）へ載せる余地は残してあるが、まず端末で完結させる。
// 同期を先に足すと、列を1本足すたびに本番DBへの適用漏れが同期全体を
// 止めるという、単語アプリで実際に起きた事故を繰り返すことになる。
//
// 保存形は「壊れていても読める」ことを優先する。localStorage は
// ユーザーが編集できるし、古いバージョンの形も残る。読み込みは
// すべて normalizeProgress を通し、型に合わない値は捨てて既定値へ倒す。
// =====================================================

export const EMPTY_PROGRESS: ComposeProgress = {
  tags: {},
  prompts: {},
  history: [],
  totalAttempts: 0,
  scoreSum: 0,
};

export const DEFAULT_SETTINGS: ComposeSettings = {
  setSize: COMPOSE.DEFAULT_SET_SIZE,
  showHints: false,
};

function toCount(raw: unknown): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toScore(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function toTimestamp(raw: unknown): number | undefined {
  const value = typeof raw === "string" ? Date.parse(raw) : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeTagStat(raw: unknown): TagStat | null {
  if (!raw || typeof raw !== "object") return null;
  const stat = raw as Record<string, unknown>;
  const attempts = toCount(stat.attempts);
  if (attempts === 0) return null;
  const ema = Number(stat.ema);
  return {
    attempts,
    ema: Number.isFinite(ema) ? Math.max(0, Math.min(100, ema)) : undefined,
    passStreak: toCount(stat.passStreak),
    lastAnswered: toTimestamp(stat.lastAnswered),
    missCount: toCount(stat.missCount),
  };
}

function normalizePromptStat(raw: unknown): PromptStat | null {
  if (!raw || typeof raw !== "object") return null;
  const stat = raw as Record<string, unknown>;
  const attempts = toCount(stat.attempts);
  if (attempts === 0) return null;
  return {
    attempts,
    bestScore: toScore(stat.bestScore),
    lastScore: toScore(stat.lastScore),
    lastAnswered: toTimestamp(stat.lastAnswered),
    passStreak: toCount(stat.passStreak),
  };
}

function normalizeAttempt(raw: unknown): ComposeAttempt | null {
  if (!raw || typeof raw !== "object") return null;
  const attempt = raw as Record<string, unknown>;
  if (typeof attempt.promptId !== "string" || typeof attempt.input !== "string") return null;
  const answeredAt = toTimestamp(attempt.answeredAt);
  if (!answeredAt) return null;

  return {
    promptId: attempt.promptId,
    direction: attempt.direction === "en-to-ja" ? "en-to-ja" : "ja-to-en",
    question: typeof attempt.question === "string" ? attempt.question : "",
    input: attempt.input,
    answers: Array.isArray(attempt.answers)
      ? attempt.answers.filter((a): a is string => typeof a === "string")
      : [],
    tags: Array.isArray(attempt.tags) ? attempt.tags.filter(isGrammarTagId) : [],
    score: toScore(attempt.score),
    verdict:
      attempt.verdict === "pass" || attempt.verdict === "close" ? attempt.verdict : "review",
    corrected: typeof attempt.corrected === "string" ? attempt.corrected : "",
    feedback: typeof attempt.feedback === "string" ? attempt.feedback : "",
    good: typeof attempt.good === "string" ? attempt.good : "",
    tagJudgements: Array.isArray(attempt.tagJudgements)
      ? (attempt.tagJudgements.filter(
          (judgement) =>
            judgement &&
            typeof judgement === "object" &&
            isGrammarTagId((judgement as Record<string, unknown>).id),
        ) as ComposeAttempt["tagJudgements"])
      : [],
    hintUsed: attempt.hintUsed === true,
    answeredAt,
  };
}

/** 保存値を安全な ComposeProgress へ正規化する */
export function normalizeProgress(raw: unknown): ComposeProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...EMPTY_PROGRESS };
  const stored = raw as Record<string, unknown>;

  const tags: Record<string, TagStat> = {};
  if (stored.tags && typeof stored.tags === "object") {
    for (const [id, value] of Object.entries(stored.tags as Record<string, unknown>)) {
      // 廃止したタグ・AIが作った架空のタグは読み込みの時点で落とす
      if (!isGrammarTagId(id)) continue;
      const stat = normalizeTagStat(value);
      if (stat) tags[id] = stat;
    }
  }

  const prompts: Record<string, PromptStat> = {};
  if (stored.prompts && typeof stored.prompts === "object") {
    for (const [id, value] of Object.entries(stored.prompts as Record<string, unknown>)) {
      const stat = normalizePromptStat(value);
      if (stat) prompts[id] = stat;
    }
  }

  const history = Array.isArray(stored.history)
    ? stored.history
        .map(normalizeAttempt)
        .filter((attempt): attempt is ComposeAttempt => attempt !== null)
        .slice(0, COMPOSE.HISTORY_LIMIT)
    : [];

  return {
    tags,
    prompts,
    history,
    totalAttempts: toCount(stored.totalAttempts),
    scoreSum: Math.max(0, Number(stored.scoreSum) || 0),
  };
}

/**
 * 1答案を学習状態へ畳み込む。
 *
 * タグの統計はその問題が試していたタグだけを動かす。AIがタグごとの
 * 判定を返していればそれを使い、返していなければ答案全体のスコアを
 * 全タグに当てる（AIが使えなかったときのローカル採点がこれに当たる）。
 */
export function applyAttemptToProgress(
  progress: ComposeProgress,
  attempt: ComposeAttempt,
): ComposeProgress {
  const tags = { ...progress.tags };
  const judgementById = new Map(attempt.tagJudgements.map((j) => [j.id, j.verdict]));

  for (const tagId of attempt.tags) {
    tags[tagId] = applyScoreToTagStat(
      tags[tagId],
      attempt.score,
      judgementById.get(tagId),
      attempt.answeredAt,
    );
  }

  const previous = progress.prompts[attempt.promptId];
  const prompts = {
    ...progress.prompts,
    [attempt.promptId]: {
      attempts: (previous?.attempts ?? 0) + 1,
      bestScore: Math.max(previous?.bestScore ?? 0, attempt.score),
      lastScore: attempt.score,
      lastAnswered: attempt.answeredAt,
      passStreak:
        attempt.score >= COMPOSE.PASS_SCORE ? (previous?.passStreak ?? 0) + 1 : 0,
    },
  };

  return {
    tags,
    prompts,
    history: [attempt, ...progress.history].slice(0, COMPOSE.HISTORY_LIMIT),
    totalAttempts: progress.totalAttempts + 1,
    scoreSum: progress.scoreSum + attempt.score,
  };
}

export function loadProgress(): ComposeProgress {
  return normalizeProgress(storage.get<unknown>(COMPOSE_STORAGE_KEYS.PROGRESS, null));
}

export function saveProgress(progress: ComposeProgress): void {
  storage.set(COMPOSE_STORAGE_KEYS.PROGRESS, progress);
}

export function normalizeSettings(raw: unknown): ComposeSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const stored = raw as Record<string, unknown>;
  const setSize = Number(stored.setSize);
  const allowed: readonly number[] = COMPOSE.SET_SIZE_OPTIONS;
  return {
    setSize: allowed.includes(setSize) ? setSize : DEFAULT_SETTINGS.setSize,
    showHints: stored.showHints === true,
  };
}

export function loadSettings(): ComposeSettings {
  return normalizeSettings(storage.get<unknown>(COMPOSE_STORAGE_KEYS.SETTINGS, null));
}

export function saveSettings(settings: ComposeSettings): void {
  storage.set(COMPOSE_STORAGE_KEYS.SETTINGS, settings);
}

/** 画面に出す通算の成績 */
export function summarizeProgress(progress: ComposeProgress): {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
} {
  const { totalAttempts, scoreSum, history } = progress;
  const passCount = history.filter((attempt) => attempt.score >= COMPOSE.PASS_SCORE).length;
  return {
    totalAttempts,
    averageScore: totalAttempts > 0 ? Math.round(scoreSum / totalAttempts) : 0,
    // 合格率は履歴（直近 HISTORY_LIMIT 件）から出す。通算だと、始めたころの
    // 出来の悪さが何ヶ月も分母に残り、伸びが数字に出ない。
    passRate: history.length > 0 ? Math.round((passCount / history.length) * 100) : 0,
  };
}
